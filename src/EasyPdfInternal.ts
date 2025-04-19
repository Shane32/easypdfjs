import { PDFDocument, PDFPage } from "pdf-lib";
import { EasyPdf } from "./EasyPdf";
import { ScaleMode } from "./ScaleMode";

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

  /** Total page dimensions in points */
  pageSizeInternal: { width: number; height: number } = { width: 0, height: 0 };

  /** Page margins in points */
  marginsInternal: { left: number; top: number; bottom: number; right: number } = { left: 0, top: 0, bottom: 0, right: 0 };

  /** Current drawing position in points */
  positionInternal: { x: number; y: number } = { x: 0, y: 0 };

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

  /**
   * Private constructor to enforce creation through static method
   * @param pdf - The underlying PDF document
   * @param options - Optional configuration for the PDF
   */
  constructor(pdf: PDFDocument, options?: { scaleMode?: ScaleMode }) {
    super();
    this._pdf = pdf;
    this._scaleMode = options?.scaleMode ?? ScaleMode.Points;

    const now = new Date();
    this._metadata = {
      creationDate: now,
      modificationDate: now,
    };
  }

  /**
   * Ensures a page exists before performing operations
   * @throws {Error} If no page has been created
   */
  ensurePageExists(): void {
    if (!this._pdfPageInternal) {
      throw new Error("No page has been created. Use newPage() first.");
    }
  }

  /**
   * Converts a value from the current scale mode to points
   * @param value - The value to convert
   * @returns The value converted to points
   */
  toPoints(value: number): number {
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

  /**
   * Converts a value from points to the current scale mode
   * @param value - The value in points to convert
   * @returns The value converted to the current scale mode
   */
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

  /**
   * Sets the scale mode with validation
   * @throws {Error} If an invalid scale mode is provided
   */
  set scaleMode(mode: ScaleMode) {
    if (!Object.values(ScaleMode).includes(mode)) {
      throw new Error(`Invalid scale mode. Must be one of: ${Object.values(ScaleMode).join(", ")}`);
    }
    this._scaleMode = mode;
  }

  /**
   * Gets the total page size
   * @throws {Error} If no page exists
   */
  get pageSize(): { readonly width: number; readonly height: number } {
    this.ensurePageExists();
    return {
      width: this.fromPoints(this.pageSizeInternal.width),
      height: this.fromPoints(this.pageSizeInternal.height),
    };
  }

  /**
   * Calculates the page size excluding margins
   * @throws {Error} If no page exists
   */
  get size(): { readonly width: number; readonly height: number } {
    this.ensurePageExists();
    return {
      width: this.fromPoints(this.pageSizeInternal.width - this.marginsInternal.left - this.marginsInternal.right),
      height: this.fromPoints(this.pageSizeInternal.height - this.marginsInternal.top - this.marginsInternal.bottom),
    };
  }

  /**
   * Gets the page margins
   * @throws {Error} If no page exists
   */
  get margins(): { readonly left: number; readonly top: number; readonly bottom: number; readonly right: number } {
    this.ensurePageExists();
    return {
      left: this.fromPoints(this.marginsInternal.left),
      top: this.fromPoints(this.marginsInternal.top),
      bottom: this.fromPoints(this.marginsInternal.bottom),
      right: this.fromPoints(this.marginsInternal.right),
    };
  }

  set margins(value: { readonly left: number; readonly top: number; readonly bottom: number; readonly right: number }) {
    this.ensurePageExists();
    this.marginsInternal = {
      left: this.toPoints(value.left),
      top: this.toPoints(value.top),
      bottom: this.toPoints(value.bottom),
      right: this.toPoints(value.right),
    };
  }

  /**
   * Gets the current drawing position
   * @throws {Error} If no page exists
   */
  get position(): { readonly x: number; readonly y: number } {
    this.ensurePageExists();
    return {
      x: this.fromPoints(this.positionInternal.x),
      y: this.fromPoints(this.positionInternal.y),
    };
  }

  set position(value: { readonly x: number; readonly y: number }) {
    this.ensurePageExists();
    this.positionInternal = {
      x: this.toPoints(value.x),
      y: this.toPoints(value.y),
    };
  }

  get x(): number {
    this.ensurePageExists();
    return this.fromPoints(this.positionInternal.x);
  }

  set x(value: number) {
    this.ensurePageExists();
    this.positionInternal.x = this.toPoints(value);
  }

  get y(): number {
    this.ensurePageExists();
    return this.fromPoints(this.positionInternal.y);
  }

  set y(value: number) {
    this.ensurePageExists();
    this.positionInternal.y = this.toPoints(value);
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
   * @param options - Page creation options
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
    // Convert all measurements to points
    const width = this.toPoints(options.width);
    const height = this.toPoints(options.height);

    // Handle landscape orientation
    const pageWidth = options.landscape ? height : width;
    const pageHeight = options.landscape ? width : height;

    // Create new page
    this.pdfPage = this._pdf.addPage([pageWidth, pageHeight]);

    // Update page and size properties
    this.pageSizeInternal = { width: pageWidth, height: pageHeight };

    // Set margins (convert to points if needed)
    this.marginsInternal = {
      left: options.leftMargin ? this.toPoints(options.leftMargin) : 36,
      right: options.rightMargin ? this.toPoints(options.rightMargin) : 36,
      top: options.topMargin ? this.toPoints(options.topMargin) : 36,
      bottom: options.bottomMargin ? this.toPoints(options.bottomMargin) : 36,
    };

    // Reset position to top-left of new page
    this.positionInternal = {
      x: this.marginsInternal.left,
      y: pageHeight - this.marginsInternal.top,
    };
  }

  /**
   * Draws a plus/cross sign at the current position
   * @param size - Total width and height of the plus sign
   * @throws {Error} If no page exists
   *
   * @remarks
   * Future improvements could include:
   * - Color customization
   * - Line thickness options
   * - Different cross/plus styles
   */
  plus(size: number): void {
    // Ensure page exists
    this.ensurePageExists();

    // Convert size to points
    const pointSize = this.toPoints(size);
    const halfSize = pointSize / 2;

    // Draw a plus/cross centered at current position
    const { x, y } = this.positionInternal;

    this.pdfPage.drawLine({
      start: { x: x - halfSize, y },
      end: { x: x + halfSize, y },
      thickness: 1,
    });

    this.pdfPage.drawLine({
      start: { x, y: y + halfSize },
      end: { x, y: y - halfSize },
      thickness: 1,
    });
  }

  /**
   * Saves the PDF document with all set metadata
   * @returns A promise resolving to the PDF bytes
   * @throws {Error} If no page exists
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

  /**
   * Gets the underlying PDF document for advanced usage
   *
   * @remarks
   * Use with caution - bypasses the abstraction layer
   */
  get pdfDocument(): PDFDocument {
    return this._pdf;
  }

  /**
   * Gets the underlying PDF page for advanced usage
   *
   * @remarks
   * Use with caution - bypasses the abstraction layer
   * @throws {Error} If no page exists
   */
  get pdfPage(): PDFPage {
    this.ensurePageExists();
    return this._pdfPageInternal!;
  }
  set pdfPage(value: PDFPage) {
    this._pdfPageInternal = value;
  }

  /**
   * Moves the drawing position to a specific coordinate
   * @param xOrCoords - Either the x coordinate or an object with x and y coordinates
   * @param y - The y coordinate (required if first parameter is a number)
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  moveTo(xOrCoords: number | { x: number; y: number }, y?: number): this {
    this.ensurePageExists();

    let x: number;
    let yCoord: number;

    if (typeof xOrCoords === "object") {
      x = xOrCoords.x;
      yCoord = xOrCoords.y;
    } else {
      x = xOrCoords;
      if (y === undefined) {
        throw new Error("Y coordinate must be provided when using separate x and y arguments");
      }
      yCoord = y;
    }

    if (!Number.isFinite(x) || !Number.isFinite(yCoord)) {
      throw new Error("Coordinates must be finite numbers");
    }
    this.positionInternal = {
      x: this.toPoints(x),
      y: this.toPoints(yCoord),
    };

    return this;
  }

  /**
   * Offsets the drawing position by the specified coordinates
   * @param xOrCoords - Either the x offset or an object with x and y offsets
   * @param y - The y offset (required if first parameter is a number)
   * @throws {Error} If no page exists
   * @returns The current EasyPdf instance for method chaining
   */
  offsetTo(xOrCoords: number | { x: number; y: number }, y?: number): this {
    this.ensurePageExists();

    let x: number;
    let yCoord: number;

    if (typeof xOrCoords === "object") {
      x = xOrCoords.x;
      yCoord = xOrCoords.y;
    } else {
      x = xOrCoords;
      if (y === undefined) {
        throw new Error("Y coordinate must be provided when using separate x and y arguments");
      }
      yCoord = y;
    }

    if (!Number.isFinite(x) || !Number.isFinite(yCoord)) {
      throw new Error("Coordinates must be finite numbers");
    }
    this.positionInternal.x += this.toPoints(x);
    this.positionInternal.y += this.toPoints(yCoord);

    return this;
  }
}
