import { PDFDocument, PDFPage } from "pdf-lib";
import { ScaleMode } from "./ScaleMode";
import { EasyPdfInternal } from "./EasyPdfInternal";

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
    const pdf = await PDFDocument.create();
    return new EasyPdfInternal(pdf, options);
  }

  /** Gets the current scale mode */
  abstract get scaleMode(): ScaleMode;
  abstract set scaleMode(mode: ScaleMode);

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
   * Draws a plus/cross sign at the current position
   * @param size - Total width and height of the plus sign
   * @throws {Error} If no page exists
   */
  abstract plus(size: number): void;

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
}
