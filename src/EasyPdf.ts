import { Color, PDFDocument, PDFPage, PDFImage } from "pdf-lib";
import { ScaleMode } from "./ScaleMode";
import { LineStyle } from "./LineStyle";
import { RectangleOptions } from "./utils/ShapeUtils";
import { PictureAlignment } from "./PictureAlignment";
import { Font } from "./Font";
import { TextAlignment } from "./TextAlignment";

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
  abstract set lineStyle(value: LineStyle);

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
   * Offsets the margins by the specified values
   * @param left - Left margin offset
   * @param top - Top margin offset
   * @param right - Right margin offset (optional)
   * @param bottom - Bottom margin offset (optional)
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract offsetMargins(left: number, top: number, right?: number, bottom?: number): this;

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

  /**
   * Gets the color used for printing text, lines and borders
   */
  abstract get foreColor(): Color;
  abstract set foreColor(value: Color);

  /**
   * Gets the color used for filling polygons, circles and ellipses
   */
  abstract get fillColor(): Color;
  abstract set fillColor(value: Color);

  /**
   * Saves the current drawing state and returns a function that can be used to restore it
   */
  abstract saveState(): () => void;

  /** Gets or sets the current picture alignment */
  abstract get pictureAlignment(): PictureAlignment;
  abstract set pictureAlignment(value: PictureAlignment);

  /**
   * Paints a picture at the current drawing position
   * @param image - The PDFImage to paint
   * @param options - Options for painting the image
   * @param options.dpi - Optional dots per inch for scaling (default: 96)
   * @param options.width - Optional width of the image (will scale proportionally if only width is provided)
   * @param options.height - Optional height of the image (will scale proportionally if only height is provided)
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract paintPicture(image: PDFImage, options: { dpi?: number; width?: number; height?: number }): this;

  /** Gets or sets the font to use when printing text */
  abstract get font(): Font;
  abstract set font(value: Font);

  /** Gets or sets the alignment of printed text */
  abstract get textAlignment(): TextAlignment;
  abstract set textAlignment(value: TextAlignment);

  /**
   * Writes one or more lines of text, with word wrapping if specified.
   * @param text - The text to write. If null, no text is written but the current position may be affected.
   * @param maxWidth - Optional maximum width before word wrapping occurs. If not specified, no word wrapping is applied.
   * @returns The current EasyPdf instance for method chaining
   */
  abstract write(text: string, maxWidth?: number): this;

  /**
   * Writes one or more lines of text, with word wrapping if specified,
   * and moves the current position to the next line.
   * @param text - Optional text to write. If not provided or null, only moves to the next line.
   * @param maxWidth - Optional maximum width before word wrapping occurs. If not specified, no word wrapping is applied.
   * @returns The current EasyPdf instance for method chaining
   */
  abstract writeLine(text?: string, maxWidth?: number): this;

  /**
   * Returns the width of the specified text using the current font.
   * @param text - The text to measure
   * @returns The width of the text in the current scale mode
   */
  abstract textWidth(text: string): number;

  /**
   * Returns the height of a single line of text.
   * @returns The height of a single line of text in the current scale mode
   */
  abstract textHeight(): number;

  /**
   * Returns the distance between the baseline and the top of capital letters.
   * @returns The cap height in the current scale mode
   */
  abstract textCapHeight(): number;

  /**
   * Returns the distance between the baseline and the top of the highest letters.
   * @returns The ascent height in the current scale mode
   */
  abstract textAscent(): number;

  /**
   * Returns the distance between the baseline and the bottom of the lowest letters.
   * @returns The descent height in the current scale mode
   */
  abstract textDescent(): number;

  /**
   * Returns the amount of additional line spacing besides the ascent and descent.
   * @returns The additional line spacing in the current scale mode
   */
  abstract textLeading(): number;

  /**
   * Returns the amount of additional line spacing between paragraphs.
   * @returns The paragraph spacing in the current scale mode
   */
  abstract textParagraphLeading(): number;

  /**
   * Draws a barcode at the current drawing position
   * @param pattern - The barcode pattern as a string of 1's and 0's or true/false values
   * @param width - Optional width of the barcode in the current scale mode
   * @param height - Optional height of the barcode in the current scale mode (defaults to 0.5 inches)
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  abstract barcode(pattern: string | boolean[], width?: number, height?: number): this;
}
