import { EasyPdfInternal } from "./EasyPdfInternal";
import { PDFNumber, PDFOperator, PDFOperatorNames } from "pdf-lib";
import {
  moveTo as pdfMoveTo,
  lineTo as pdfLineTo,
  stroke as pdfStroke,
  fill as pdfFill,
  appendQuadraticCurve as pdfQuadraticCurveTo,
  appendBezierCurve as pdfBezierCurveTo,
} from "pdf-lib";
import { LineStyle, cloneLineStyle } from "./LineStyle";

// Custom PDF operators for even-odd fill rule
const pdfEoFill = () => PDFOperator.of(PDFOperatorNames.FillEvenOdd);
const pdfEoFillStroke = () => PDFOperator.of(PDFOperatorNames.CloseFillEvenOddAndStroke);
const pdfFillStroke = () => PDFOperator.of(PDFOperatorNames.CloseFillNonZeroAndStroke);
const pdfCloseStroke = () => PDFOperator.of(PDFOperatorNames.CloseAndStroke);
const pdfAppendRectangle = (x: number, y: number, width: number, height: number) =>
  PDFOperator.of(PDFOperatorNames.AppendRectangle, [PDFNumber.of(x), PDFNumber.of(y), PDFNumber.of(width), PDFNumber.of(height)]);

/**
 * Represents a line segment with start and end coordinates
 */
interface LineSegment {
  type: "line";
  end: { x: number; y: number };
}

/**
 * Represents a quadratic curve segment with control point and end coordinates
 */
interface QuadraticCurveSegment {
  type: "quadratic";
  controlPoint: { x: number; y: number };
  end: { x: number; y: number };
}

/**
 * Represents a cubic Bezier curve segment with two control points and end coordinates
 */
interface BezierCurveSegment {
  type: "bezier";
  controlPoint1: { x: number; y: number };
  controlPoint2: { x: number; y: number };
  end: { x: number; y: number };
}

/**
 * Represents a rectangle segment with x, y, width, and height
 */
interface RectangleSegment {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Union type for all possible segment types
 */
type PathSegment = LineSegment | QuadraticCurveSegment | BezierCurveSegment | RectangleSegment;

/**
 * Represents the state of building a connected sequence of line or curve segments
 */
export class PathState {
  /** Starting coordinates of the path */
  private _start: { readonly x: number; readonly y: number } = { x: 0, y: 0 };

  /** Line style at the start of the path */
  private _startLineStyle: LineStyle = new LineStyle();

  /** Array of path segments */
  private _segments: PathSegment[] = [];

  /** Reference to EasyPdfInternal for drawing operations */
  private _easyPdfInternal: EasyPdfInternal;

  /**
   * Creates a new PathState with starting coordinates and EasyPdfInternal reference
   * @param start - The starting point of the path
   * @param easyPdfInternal - The EasyPdfInternal instance for drawing
   */
  constructor(easyPdfInternal: EasyPdfInternal) {
    this._easyPdfInternal = easyPdfInternal;
  }

  /**
   * Checks if the line style has changed and draws the current path if needed
   */
  private checkLineStyleChanged(): void {
    // If we have segments and a stored line style
    if (this._segments.length > 0) {
      const currentLineStyle = this._easyPdfInternal.lineStyle;

      // Check if any line style properties have changed
      const lineStyleChanged =
        this._startLineStyle.width !== currentLineStyle.width ||
        this._startLineStyle.capStyle !== currentLineStyle.capStyle ||
        this._startLineStyle.joinStyle !== currentLineStyle.joinStyle ||
        this._startLineStyle.dashStyle !== currentLineStyle.dashStyle;

      // If line style changed, draw the current path
      if (lineStyleChanged) {
        this.drawLine();

        // Update the start point with new object
        this._start = {
          x: this._easyPdfInternal.positionInternal.x,
          y: this._easyPdfInternal.positionInternal.y,
        };

        // Update the line style
        this._startLineStyle = cloneLineStyle(currentLineStyle);

        // Apply the current line style
        this._easyPdfInternal.setLineStyle();
      }
    } else {
      // If we are not in a line, start a new path with new object
      this._start = {
        x: this._easyPdfInternal.positionInternal.x,
        y: this._easyPdfInternal.positionInternal.y,
      };
      this._startLineStyle = cloneLineStyle(this._easyPdfInternal.lineStyle);

      // Apply the current line style
      this._easyPdfInternal.setLineStyle();
    }
  }

  /**
   * Generates path operators for the current path
   * @returns Array of PDF operators representing the path
   */
  private generatePathOperators(): PDFOperator[] {
    // Create path operators starting with move to the start point
    const pathOperators: PDFOperator[] = [pdfMoveTo(this._start.x, this._start.y)];

    // Add segments to path
    for (const segment of this._segments) {
      switch (segment.type) {
        case "line":
          pathOperators.push(pdfLineTo(segment.end.x, segment.end.y));
          break;
        case "quadratic": {
          pathOperators.push(pdfQuadraticCurveTo(segment.controlPoint.x, segment.controlPoint.y, segment.end.x, segment.end.y));
          break;
        }
        case "bezier": {
          pathOperators.push(
            pdfBezierCurveTo(
              segment.controlPoint1.x,
              segment.controlPoint1.y,
              segment.controlPoint2.x,
              segment.controlPoint2.y,
              segment.end.x,
              segment.end.y
            )
          );
          break;
        }
        case "rectangle": {
          pathOperators.push(pdfAppendRectangle(segment.x, segment.y, segment.width, segment.height));
          break;
        }
      }
    }

    // Clear segments after drawing
    this._segments = [];

    return pathOperators;
  }

  /**
   * Draws a line using the current path
   * @param options - Optional line drawing options
   */
  drawLine(): void {
    const page = this._easyPdfInternal.pdfPage;

    // Return if no segments exist
    if (this._segments.length === 0) {
      return;
    }

    // Note: do NOT call checkLineStyleChanged() here, as it occurs in lineTo and similar methods, and we if the
    // style HAS changed, we want to be able to draw the current path with the old style.

    // Generate path operators and add stroke operator
    page.pushOperators(...this.generatePathOperators(), pdfStroke());
  }

  /**
   * Draws a polygon using the current path
   * @param border - Border drawing options
   * @param fill - Fill color options
   * @param eoFill - Whether to use even-odd fill rule
   */
  drawPolygon(border?: boolean, fill?: boolean, eoFill?: boolean): void {
    const page = this._easyPdfInternal.pdfPage;

    // Return if no segments exist
    if (this._segments.length === 0) {
      return;
    }

    // Check if line style has changed before drawing with border
    this.checkLineStyleChanged();

    // Generate path operators
    const pathOperators = this.generatePathOperators();

    // Add appropriate operators based on parameters
    if (border) {
      if (eoFill) {
        // Fill with even-odd rule and stroke
        page.pushOperators(...pathOperators, pdfEoFillStroke());
      } else if (fill) {
        // Fill and stroke
        page.pushOperators(...pathOperators, pdfFillStroke());
      } else {
        // Just stroke
        page.pushOperators(...pathOperators, pdfCloseStroke());
      }
    } else if (eoFill) {
      // Fill with even-odd rule
      page.pushOperators(...pathOperators, pdfEoFill());
    } else if (fill) {
      // Fill
      page.pushOperators(...pathOperators, pdfFill());
    } else {
      // No fill or stroke; do nothing
    }

    // Restore the position to the start point
    this._easyPdfInternal.positionInternal = this._start;
  }

  /**
   * Adds a line segment to the path
   * @param end - The end coordinates of the line segment
   * @returns The current PathState instance for method chaining
   */
  lineTo(end: { x: number; y: number }): this {
    this.checkLineStyleChanged();
    this._segments.push({
      type: "line",
      end,
    });
    return this;
  }

  /**
   * Adds a quadratic curve segment to the path
   * @param controlPoint - The control point of the quadratic curve
   * @param end - The end coordinates of the curve segment
   * @returns The current PathState instance for method chaining
   */
  quadraticCurveTo(controlPoint: { x: number; y: number }, end: { x: number; y: number }): this {
    this.checkLineStyleChanged();
    this._segments.push({
      type: "quadratic",
      controlPoint,
      end,
    });
    return this;
  }

  /**
   * Adds a cubic Bezier curve segment to the path
   * @param controlPoint1 - The first control point of the Bezier curve
   * @param controlPoint2 - The second control point of the Bezier curve
   * @param end - The end coordinates of the curve segment
   * @returns The current PathState instance for method chaining
   */
  bezierCurveTo(controlPoint1: { x: number; y: number }, controlPoint2: { x: number; y: number }, end: { x: number; y: number }): this {
    this.checkLineStyleChanged();
    this._segments.push({
      type: "bezier",
      controlPoint1,
      controlPoint2,
      end,
    });
    return this;
  }

  /**
   * Adds a rectangle segment to the path
   * @param x - The x-coordinate of the rectangle's bottom-left corner
   * @param y - The y-coordinate of the rectangle's bottom-left corner
   * @param width - The width of the rectangle
   * @param height - The height of the rectangle
   * @returns The current PathState instance for method chaining
   */
  rectangle(x: number, y: number, width: number, height: number): this {
    this.checkLineStyleChanged();
    this._segments.push({
      type: "rectangle",
      x,
      y,
      width,
      height,
    });
    return this;
  }
}
