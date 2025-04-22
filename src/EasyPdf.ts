import { PDFDocument, PDFPage } from "pdf-lib";
import { ScaleMode } from "./ScaleMode";
import { LineStyle } from "./LineStyle";
import { RectangleOptions } from "./utils/ShapeUtils";

/**
 * EasyPdf: A high-level, user-friendly PDF document creation library
 *
 * Key Design Principles:
 * - Abstraction of low-level PDF manipulation
 * - Flexible scale mode conversion
 * - Immutable state management
 * - Lazy page creation
 *
 * @remarks
 * This class provides a simplified interface for PDF document creation,
 * with built-in support for different measurement scales and metadata management.
 */
export abstract class EasyPdf {
  /** Creates a new EasyPdf instance
   * @param options - Optional configuration for the PDF
   * @returns A promise resolving to an EasyPdf instance
   */
  static async create(options?: { scaleMode?: ScaleMode }): Promise<EasyPdf> {
    // Dynamically import to break circular dependency
    const imported = await import("./EasyPdfInternal");
    const pdf = await PDFDocument.create();
    return new imported.EasyPdfInternal(pdf, options);
  }

  /** Gets the current scale mode */
  abstract get scaleMode(): ScaleMode;
  abstract set scaleMode(mode: ScaleMode);

  /** Gets the current line style */
  abstract get lineStyle(): LineStyle;

  /**
   * Gets the total page size
   * @throws {Error} If no page exists
   */
  abstract get pageSize(): { readonly width: number; readonly height: number };

  /**
   * Calculates the page size excluding margins
   * @throws {Error} If no page exists
   */
  abstract get size(): { readonly width: number; readonly height: number };

  /**
   * Gets the page margins
   * @throws {Error} If no page exists
   */
  abstract get margins(): { readonly left: number; readonly top: number; readonly bottom: number; readonly right: number };
  abstract set margins(value: { readonly left: number; readonly top: number; readonly bottom: number; readonly right: number });

  /**
   * Gets or sets the current drawing position
   * @throws {Error} If no page exists
   */
  abstract get position(): { readonly x: number; readonly y: number };
  abstract set position(value: { readonly x: number; readonly y: number });

  /** Gets or sets the current x coordinate */
  abstract get x(): number;
  abstract set x(value: number);

  /** Gets or sets the current y coordinate */
  abstract get y(): number;
  abstract set y(value: number);

  /** Gets or sets the current metadata */
  abstract get metadata(): {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    creationDate: Date;
    modificationDate: Date;
    producer?: string;
  };

  /** Sets the metadata, replacing existing values */
  abstract set metadata(value: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    creationDate: Date;
    modificationDate: Date;
    producer?: string;
  });

  /**
   * Creates a new page with specified dimensions and optional margins
   * @param options - Page creation options
   * @remarks Resets the drawing position to the top-left of the new page
   */
  abstract newPage(options: {
    width: number;
    height: number;
    landscape?: boolean;
    leftMargin?: number;
    rightMargin?: number;
    topMargin?: number;
    bottomMargin?: number;
  }): void;

  /**
   * Saves the PDF document with all set metadata
   * @returns A promise resolving to the PDF bytes
   * @throws {Error} If no page exists
   */
  abstract save(): Promise<Uint8Array>;

  /**
   * Gets the underlying PDF document for advanced usage
   * @remarks Use with caution - bypasses the abstraction layer
   */
  abstract get pdfDocument(): PDFDocument;

  /**
   * Gets the underlying PDF page for advanced usage
   * @remarks Use with caution - bypasses the abstraction layer
   * @throws {Error} If no page exists
   */
  abstract get pdfPage(): PDFPage;

  /**
   * Moves the drawing position to a specific coordinate
   * @param xOrCoords - Either the x coordinate or an object with x and y coordinates
   * @param y - The y coordinate (required if first parameter is a number)
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract moveTo(coordinates: { x: number; y: number }): this;
  abstract moveTo(x: number, y: number): this;

  /**
   * Offsets the drawing position by the specified coordinates
   * @param xOrCoords - Either the x offset or an object with x and y offsets
   * @param y - The y offset (required if first parameter is a number)
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract offsetTo(coordinates: { x: number; y: number }): this;
  abstract offsetTo(x: number, y: number): this;

  /**
   * Adds a line segment from the current position to the specified coordinates
   * @param xOrCoords - Either the x coordinate or an object with x and y coordinates
   * @param y - The y coordinate (required if first parameter is a number)
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract lineTo(coordinates: { x: number; y: number }): this;
  abstract lineTo(x: number, y: number): this;

  /**
   * Adds a quadratic curve segment from the current position to the specified end point
   * @param controlPoint - The control point of the quadratic curve
   * @param end - The end point of the curve
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract quadraticCurveTo(controlPoint: { x: number; y: number }, end: { x: number; y: number }): this;

  /**
   * Adds a cubic Bezier curve segment from the current position to the specified end point
   * @param controlPoint1 - The first control point of the Bezier curve
   * @param controlPoint2 - The second control point of the Bezier curve
   * @param end - The end point of the curve
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract bezierCurveTo(
    controlPoint1: { x: number; y: number },
    controlPoint2: { x: number; y: number },
    end: { x: number; y: number }
  ): this;

  /**
   * Draws the current path on the page
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract finishLine(): this;

  /**
   * Completes and draws a polygon from the current path and
   * sets the current position to the start of the polygon
   * @param border - Whether to draw a border around the polygon
   * @param fill - Whether to fill the polygon
   * @param eoFill - Whether to use the even-odd fill rule instead of the non-zero winding rule
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract finishPolygon(border?: boolean, fill?: boolean, eoFill?: boolean): this;

  /**
   * Draws a circle at the current drawing position
   * @param radius - The radius of the circle
   * @param border - Whether to draw a border around the circle (default: true)
   * @param fill - Whether to fill the circle (default: false)
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract circle(radius: number, border?: boolean, fill?: boolean): this;

  /**
   * Draws an ellipse at the current drawing position
   * @param radiusX - The horizontal radius of the ellipse
   * @param radiusY - The vertical radius of the ellipse
   * @param border - Whether to draw a border around the ellipse (default: true)
   * @param fill - Whether to fill the ellipse (default: false)
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract ellipse(radiusX: number, radiusY: number, border?: boolean, fill?: boolean): this;

  /**
   * Draws a rectangle at the current drawing position
   * @param width - The width of the rectangle
   * @param height - The height of the rectangle
   * @param borderRadius - Optional corner radius for rounded rectangles
   * @param border - Whether to draw a border around the rectangle (default: true)
   * @param fill - Whether to fill the rectangle (default: false)
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract rectangle(width: number, height: number, borderRadius?: number, border?: boolean, fill?: boolean): this;

  /**
   * Draws a rectangle with advanced options
   * @param options - Comprehensive rectangle drawing options
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract rectangle(options: RectangleOptions): this;

  /**
   * Adds a corner to the current path with optional bulge
   * @param offsetX - Horizontal offset from the current position
   * @param offsetY - Vertical offset from the current position
   * @param fromSide - Whether the corner is drawn from the side (default: false)
   * @param bulgeHorizontal - Horizontal bulge amount (default: 0)
   * @param bulgeVertical - Vertical bulge amount (default: 0)
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract cornerTo(offsetX: number, offsetY: number, fromSide?: boolean, bulgeHorizontal?: number, bulgeVertical?: number): this;
}
