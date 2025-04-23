import { Color, PDFDocument, PDFPage, PDFImage, concatTransformationMatrix, grayscale, setFillingColor, setStrokingColor } from "pdf-lib";
import { EasyPdf } from "./EasyPdf";
import { ScaleMode } from "./ScaleMode";
import { cloneLineStyle, LineStyle } from "./LineStyle";
import { parseCoordinates } from "./utils/CoordinateUtils";
import { applyLineStyle } from "./utils/LineStyleUtils";
import { PathState } from "./PathState";
import { RectangleOptions, drawRectangle, drawEllipse, cornerTo as shapeUtilsCornerTo } from "./utils/ShapeUtils";
import { PictureAlignment } from "./PictureAlignment";
import { paintPicture } from "./utils/PictureUtils";

/**
 * Internal implementation of EasyPdf
 *
 * @remarks
 * This class provides the concrete implementation of the EasyPdf abstract class
 */
export class EasyPdfInternal extends EasyPdf {
  /** Underlying PDF document instance */
  private _pdf: PDFDocument;

  /** Internal storage for the current page to enable lazy loading */
  private _pdfPageInternal: PDFPage | null = null;

  /** Current scale mode for dimension calculations */
  private _scaleMode: ScaleMode;

  /** Current line style for drawing operations */
  private _lineStyle: LineStyle;

  /** Last line style that was applied to the PDF page */
  private _lastSetLineStyle: LineStyle | null = null;

  /** Current stroke color */
  private _foreColor: Color = grayscale(0);

  /** Current fill color */
  private _fillColor: Color = grayscale(0);

  /** Current picture alignment */
  private _pictureAlignment: PictureAlignment = PictureAlignment.LeftTop;

  /** Path state for drawing operations */
  readonly pathState: PathState;

  /** Total page dimensions in points */
  pageSizeInternal: { readonly width: number; readonly height: number } = { width: 0, height: 0 };

  /** Page margins in points */
  marginsInternal: { readonly left: number; readonly top: number; readonly bottom: number; readonly right: number } = {
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  };

  /** Current drawing position in points */
  positionInternal: { readonly x: number; readonly y: number } = { x: 0, y: 0 };

  /**
   * Metadata for the PDF document
   * @remarks Optional fields allow for flexible metadata management
   */
  private _metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    creationDate: Date;
    modificationDate: Date;
    producer?: string;
  };

  /** Private constructor to enforce creation through static method */
  constructor(pdf: PDFDocument, options?: { scaleMode?: ScaleMode }) {
    super();
    this._pdf = pdf;
    this._scaleMode = options?.scaleMode ?? ScaleMode.Points;
    this._lineStyle = new LineStyle();
    this.pathState = new PathState(this);

    const now = new Date();
    this._metadata = {
      creationDate: now,
      modificationDate: now,
    };
  }

  /** Gets the current line style */
  get lineStyle(): LineStyle {
    return this._lineStyle;
  }
  set lineStyle(value: LineStyle) {
    this._lineStyle = value;
  }

  /** Applies the current line style settings to the PDF page */
  setLineStyle(): this {
    this.ensurePageExists();

    this._lastSetLineStyle = applyLineStyle(this.pdfPage, this._lineStyle, this._lastSetLineStyle, this._pdf);

    return this;
  }

  /** Ensures a page exists before performing operations */
  ensurePageExists(): void {
    if (!this._pdfPageInternal) {
      throw new Error("No page has been created. Use newPage() first.");
    }
  }

  /** Converts a value from the current scale mode to points */
  toPoints(value: number, propertyName?: string): number {
    if (!Number.isFinite(value)) {
      throw new Error(`${propertyName ?? "value"} is not a finite number.`);
    }
    switch (this._scaleMode) {
      case ScaleMode.Hundredths:
        return value * 0.01 * 72; // 1/100 of an inch
      case ScaleMode.Inches:
        return value * 72; // 1 inch = 72 points
      case ScaleMode.Points:
      default:
        return value;
    }
  }

  /** Converts an object with x and y coordinates from the current scale mode to points */
  toPointsObj(obj: { x: number; y: number }, propertyName?: string): { x: number; y: number } {
    return {
      x: this.toPoints(obj.x, (propertyName ? propertyName + "." : "") + "x"),
      y: this.toPoints(obj.y, (propertyName ? propertyName + "." : "") + "y"),
    };
  }

  /** Converts a value from points to the current scale mode */
  fromPoints(value: number): number {
    switch (this._scaleMode) {
      case ScaleMode.Hundredths:
        return (value / 72) * 100; // points to 1/100 of an inch
      case ScaleMode.Inches:
        return value / 72; // points to inches
      case ScaleMode.Points:
      default:
        return value;
    }
  }

  /** Gets the current scale mode */
  get scaleMode(): ScaleMode {
    return this._scaleMode;
  }

  /** Sets the scale mode with validation */
  set scaleMode(mode: ScaleMode) {
    if (!Object.values(ScaleMode).includes(mode)) {
      throw new Error(`Invalid scale mode. Must be one of: ${Object.values(ScaleMode).join(", ")}`);
    }
    this._scaleMode = mode;
  }

  /** Gets the total page size */
  get pageSize(): { readonly width: number; readonly height: number } {
    this.ensurePageExists();
    return {
      width: this.fromPoints(this.pageSizeInternal.width),
      height: this.fromPoints(this.pageSizeInternal.height),
    };
  }

  /** Calculates the page size excluding margins */
  get size(): { readonly width: number; readonly height: number } {
    this.ensurePageExists();
    return {
      width: this.fromPoints(this.pageSizeInternal.width - this.marginsInternal.left - this.marginsInternal.right),
      height: this.fromPoints(this.pageSizeInternal.height - this.marginsInternal.top - this.marginsInternal.bottom),
    };
  }

  /** Gets the page margins */
  get margins(): { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number } {
    this.ensurePageExists();
    return {
      left: this.fromPoints(this.marginsInternal.left),
      top: this.fromPoints(this.marginsInternal.top),
      right: this.fromPoints(this.marginsInternal.right),
      bottom: this.fromPoints(this.marginsInternal.bottom),
    };
  }

  set margins(value: { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number }) {
    this.finishLine();
    const newMarginOffset = { left: this.toPoints(value.left, "value.left"), top: this.toPoints(value.top, "value.top") };
    const difference = { left: newMarginOffset.left - this.marginsInternal.left, top: newMarginOffset.top - this.marginsInternal.top };
    if (difference.left != 0 || difference.top != 0) {
      this.pdfPage.pushOperators(concatTransformationMatrix(1, 0, 0, 1, difference.left, difference.top));
    }
    this.marginsInternal = {
      left: newMarginOffset.left,
      top: newMarginOffset.top,
      right: this.toPoints(value.right, "value.right"),
      bottom: this.toPoints(value.bottom, "value.bottom"),
    };
  }

  /** Offsets the margins by the specified values */
  offsetMargins(left: number, top: number, right: number = 0, bottom: number = 0): this {
    const currentMargins = this.margins;
    this.margins = {
      left: currentMargins.left + left,
      top: currentMargins.top + top,
      right: currentMargins.right + right,
      bottom: currentMargins.bottom + bottom,
    };

    return this;
  }

  /** Gets the current drawing position */
  get position(): { readonly x: number; readonly y: number } {
    this.ensurePageExists();
    return {
      x: this.fromPoints(this.positionInternal.x),
      y: this.fromPoints(this.positionInternal.y),
    };
  }

  set position(value: { readonly x: number; readonly y: number }) {
    this.ensurePageExists();
    this.positionInternal = this.toPointsObj(value, "value");
  }

  get x(): number {
    this.ensurePageExists();
    return this.fromPoints(this.positionInternal.x);
  }

  set x(value: number) {
    this.ensurePageExists();
    this.positionInternal = {
      x: this.toPoints(value),
      y: this.positionInternal.y,
    };
  }

  get y(): number {
    this.ensurePageExists();
    return this.fromPoints(this.positionInternal.y);
  }

  set y(value: number) {
    this.ensurePageExists();
    this.positionInternal = {
      x: this.positionInternal.x,
      y: this.toPoints(value),
    };
  }

  /** Gets the current metadata */
  get metadata(): typeof this._metadata {
    return this._metadata;
  }

  /** Sets the metadata, replacing existing values */
  set metadata(value: typeof this._metadata) {
    this._metadata = value;
  }

  /**
   * Creates a new page with specified dimensions and optional margins
   * @remarks Resets the drawing position to the top-left of the new page
   */
  newPage(options: {
    width: number;
    height: number;
    landscape?: boolean;
    leftMargin?: number;
    rightMargin?: number;
    topMargin?: number;
    bottomMargin?: number;
  }): void {
    if (this._pdfPageInternal) {
      // Ensure any existing path is finished before creating a new page
      this.finishLine();
    }

    // Convert values to points and validate
    const width = this.toPoints(options.width, "options.width");
    const height = this.toPoints(options.height, "options.height");
    const margins = {
      left: this.toPoints(options.leftMargin ?? 0, "options.leftMargin"),
      right: this.toPoints(options.rightMargin ?? options.leftMargin ?? 0, "options.rightMargin"),
      top: this.toPoints(options.topMargin ?? 0, "options.topMargin"),
      bottom: this.toPoints(options.bottomMargin ?? options.topMargin ?? 0, "options.bottomMargin"),
    };

    // Handle landscape orientation
    const pageWidth = options.landscape ? height : width;
    const pageHeight = options.landscape ? width : height;

    // Create new page
    this.pdfPage = this._pdf.addPage([pageWidth, pageHeight]);

    // Set margins (convert to points if needed)
    this.marginsInternal = margins;

    // Concatenate the current transformation matrix (CTM) with a new matrix that translates the origin to the
    // specified margin location and flips the y-axis orientation.  This is necessary so that (0, 0) represents
    // the top-left corner of the page rather than the bottom-left corner.
    this.pdfPage.pushOperators(concatTransformationMatrix(1, 0, 0, -1, margins.left, pageHeight - margins.top));

    // Update page and size properties
    this.pageSizeInternal = { width: pageWidth, height: pageHeight };

    // Reset position to top-left of new page
    this.positionInternal = {
      x: this.marginsInternal.left,
      y: pageHeight - this.marginsInternal.top,
    };
  }

  /**
   * Saves the PDF document with all set metadata
   *
   * @remarks
   * Only non-empty metadata fields are set to avoid overwriting
   */
  async save(): Promise<Uint8Array> {
    // Ensure page exists
    this.ensurePageExists();

    // Set metadata only if values exist
    if (this._metadata.title) this._pdf.setTitle(this._metadata.title);
    if (this._metadata.author) this._pdf.setAuthor(this._metadata.author);
    if (this._metadata.subject) this._pdf.setSubject(this._metadata.subject);
    if (this._metadata.keywords) this._pdf.setKeywords(this._metadata.keywords);
    if (this._metadata.creator) this._pdf.setCreator(this._metadata.creator);
    if (this._metadata.producer) this._pdf.setProducer(this._metadata.producer);
    this._pdf.setCreationDate(this._metadata.creationDate);
    this._pdf.setModificationDate(this._metadata.modificationDate);

    // Save and return PDF bytes
    return this._pdf.save();
  }

  /** Gets the underlying PDF document for advanced usage */
  get pdfDocument(): PDFDocument {
    return this._pdf;
  }

  /** Gets the underlying PDF page for advanced usage */
  get pdfPage(): PDFPage {
    this.ensurePageExists();
    return this._pdfPageInternal!;
  }
  set pdfPage(value: PDFPage) {
    this._pdfPageInternal = value;
  }

  /** Moves the drawing position to a specific coordinate */
  moveTo(xOrCoords: number | { x: number; y: number }, y?: number): this {
    this.finishLine();

    this.positionInternal = this.toPointsObj(parseCoordinates(xOrCoords, y));

    return this;
  }

  /** Offsets the drawing position by the specified coordinates */
  offsetTo(xOrCoords: number | { x: number; y: number }, y?: number): this {
    this.finishLine();

    const coords = this.toPointsObj(parseCoordinates(xOrCoords, y));
    this.positionInternal = {
      x: this.positionInternal.x + coords.x,
      y: this.positionInternal.y + coords.y,
    };

    return this;
  }

  /** Adds a line segment from the current position to the specified coordinates */
  lineTo(xOrCoords: number | { x: number; y: number }, y?: number): this {
    this.ensurePageExists();

    const pointCoords = this.toPointsObj(parseCoordinates(xOrCoords, y));
    this.pathState.lineTo(pointCoords);
    this.positionInternal = pointCoords;

    return this;
  }

  /** Adds a quadratic curve segment from the current position to the specified end point */
  quadraticCurveTo(controlPoint: { x: number; y: number }, end: { x: number; y: number }): this {
    this.ensurePageExists();

    const endInPoints = this.toPointsObj(end, "end");
    this.pathState.quadraticCurveTo(this.toPointsObj(controlPoint, "controlPoint"), endInPoints);
    this.positionInternal = endInPoints;

    return this;
  }

  /** Adds a cubic Bezier curve segment from the current position to the specified end point */
  bezierCurveTo(controlPoint1: { x: number; y: number }, controlPoint2: { x: number; y: number }, end: { x: number; y: number }): this {
    this.ensurePageExists();

    const endInPoints = this.toPointsObj(end, "end");
    this.pathState.bezierCurveTo(
      this.toPointsObj(controlPoint1, "controlPoint1"),
      this.toPointsObj(controlPoint2, "controlPoint2"),
      endInPoints
    );
    this.positionInternal = endInPoints;

    return this;
  }

  /** Internal method for drawing rectangles */
  rectangleInternal(width: number, height: number, propertyDescription?: string): this {
    this.ensurePageExists();
    this.pathState.rectangle(
      this.positionInternal.x,
      this.positionInternal.y,
      this.toPoints(width, `${propertyDescription ? propertyDescription + "." : ""}width`),
      this.toPoints(height, `${propertyDescription ? propertyDescription + "." : ""}height`)
    );
    return this;
  }

  /** Finishes the current line drawing operation */
  finishLine(): this {
    this.ensurePageExists();

    this.pathState.drawLine();
    this.setLineStyle(); // Ensures the line style is applied even if no segments are drawn

    return this;
  }

  /**
   * Completes and draws a polygon from the current path and
   * sets the current position to the start of the polygon
   */
  finishPolygon(border: boolean, fill: boolean, eoFill: boolean = false): this {
    this.ensurePageExists();

    this.pathState.drawPolygon(border, fill, eoFill);
    this.setLineStyle(); // Ensures the line style is applied even if no segments are drawn

    return this;
  }

  /** Draws an circle at the current position */
  circle(radius: number, border = true, fill = false): this {
    return this.ellipse(radius, radius, border, fill);
  }

  /** Draws an ellipse at the current position */
  ellipse(radiusX: number, radiusY: number, border = true, fill = false): this {
    this.ensurePageExists();

    drawEllipse(this, radiusX, radiusY, border, fill);

    return this;
  }

  /** Draws a rectangle at the current drawing position */
  rectangle(widthOrOptions: number | RectangleOptions, height?: number, borderRadius: number = 0, border = true, fill = false): this {
    this.ensurePageExists();

    if (typeof widthOrOptions === "object") {
      drawRectangle(this, widthOrOptions);
    } else {
      drawRectangle(this, {
        width: widthOrOptions,
        height: height ?? widthOrOptions,
        borderRadius,
        border,
        fill,
      });
    }
    return this;
  }

  /** Adds a corner to the current path with optional bulge */
  cornerTo(offsetX: number, offsetY: number, fromSide = false, bulgeHorizontal?: number, bulgeVertical?: number): this {
    this.ensurePageExists();
    shapeUtilsCornerTo(this, offsetX, offsetY, fromSide, bulgeHorizontal, bulgeVertical);
    return this;
  }

  get foreColor(): Color {
    return this._foreColor;
  }

  set foreColor(value: Color) {
    this.finishLine();
    this.pdfPage.pushOperators(setStrokingColor(value));
    this._foreColor = value;
  }

  get fillColor(): Color {
    return this._fillColor;
  }

  set fillColor(value: Color) {
    this.finishLine();
    this.pdfPage.pushOperators(setFillingColor(value));
    this._fillColor = value;
  }

  /** Saves the current drawing state and returns a function that can be used to restore it */
  saveState(): () => void {
    this.finishLine();
    const scaleMode = this.scaleMode;
    const position = this.position;
    const foreColor = this.foreColor;
    const fillColor = this.fillColor;
    const lineStyle = cloneLineStyle(this.lineStyle);
    const margins = this.margins;
    return () => {
      this.scaleMode = scaleMode;
      this.position = position;
      this.foreColor = foreColor;
      this.fillColor = fillColor;
      this.lineStyle = lineStyle;
      this.margins = margins;
    };
  }

  /** Gets the current picture alignment */
  get pictureAlignment(): PictureAlignment {
    return this._pictureAlignment;
  }

  /** Sets the current picture alignment */
  set pictureAlignment(value: PictureAlignment) {
    this._pictureAlignment = value;
  }

  /** Paints a picture at the current drawing position */
  paintPicture(image: PDFImage, options: { dpi?: number; width?: number; height?: number }): this {
    this.finishLine();
    paintPicture(this, image, options);
    return this;
  }
}
