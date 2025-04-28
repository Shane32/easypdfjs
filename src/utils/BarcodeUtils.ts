import { EasyPdfInternal } from "../EasyPdfInternal";
import { fill, PDFOperator, rectangle } from "pdf-lib";
import { PictureAlignment } from "../PictureAlignment";

/**
 * QR code matrix type that can be:
 * - 2D array of booleans (true = dark module, false = light module)
 * - Object with getModuleCount() and isDark(row, col) methods
 * - Object with a modules property containing a 2D boolean array
 */
export type QRCodeMatrix =
  | boolean[][]
  | { getModuleCount: () => number; isDark: (row: number, col: number) => boolean }
  | { modules: boolean[][] };

/**
 * Draws a barcode pattern to the PDF stream.
 *
 * @param pdf The EasyPdfInternal instance
 * @param pattern The barcode pattern as a string of 1's and 0's or true/false values
 * @param options Options for rendering the barcode
 * @param options.width The total width of the barcode in the current scale mode (optional)
 * @param options.height The height of the barcode in the current scale mode (optional, defaults to 0.5 inches)
 * @param options.invert Whether to invert the colors of the barcode (default: false)
 * @param options.quietZone Whether to include a quiet zone (white space margin) around the barcode (default: true)
 */
export function drawBarcode(
  pdf: EasyPdfInternal,
  pattern: string | boolean[],
  options?: { width?: number; height?: number; invert?: boolean; quietZone?: boolean }
): void {
  if (!pattern || pattern.length === 0) {
    throw new Error("Pattern cannot be empty");
  }

  // Define isDarkBar function based on the pattern
  let isDarkBar = (index: number) => pattern[index] === "1" || pattern[index] === true;

  // Apply or remove quiet zone based on options
  let hasQuietZone = pattern.length >= 10;
  if (hasQuietZone) {
    for (let i = 0; i < 10; i++) {
      if (isDarkBar(i) || isDarkBar(pattern.length - 1 - i)) {
        hasQuietZone = false;
        break;
      }
    }
  }
  const includeQuietZone = options?.quietZone !== false;
  if (hasQuietZone && !includeQuietZone) {
    const newPattern: boolean[] = [];
    for (let i = 10; i < pattern.length - 10; i++) {
      newPattern.push(isDarkBar(i));
    }
    pattern = newPattern;
  } else if (!hasQuietZone && includeQuietZone) {
    const newPattern: boolean[] = [];
    for (let i = 0; i < pattern.length + 20; i++) {
      if (i < 10 || i >= pattern.length + 10) {
        newPattern.push(false); // Quiet zone is light
      } else {
        newPattern.push(isDarkBar(i - 10));
      }
    }
    pattern = newPattern;
  }

  // Apply inversion if requested
  if (options?.invert) {
    const oldIsDarkBar = isDarkBar;
    isDarkBar = (index) => !oldIsDarkBar(index);
  }

  // Default height to 0.5 inches if not provided
  const heightInPoints = options?.height !== undefined ? pdf.toPoints(options.height) : 36; // 0.5 inches = 36 points

  // Calculate the width of each bar in points based on the total width or use a default width of 3 points
  const barWidth = options?.width !== undefined ? pdf.toPoints(options.width) / pattern.length : 3;
  const totalWidth = barWidth * pattern.length;

  // Get current position
  let { x, y } = pdf.positionInternal;

  // Calculate position based on picture alignment
  switch (pdf.pictureAlignment) {
    case PictureAlignment.LeftTop:
      break;
    case PictureAlignment.CenterTop:
      x -= totalWidth / 2;
      break;
    case PictureAlignment.RightTop:
      x -= totalWidth;
      break;
    case PictureAlignment.LeftCenter:
      y -= heightInPoints / 2;
      break;
    case PictureAlignment.CenterCenter:
      x -= totalWidth / 2;
      y -= heightInPoints / 2;
      break;
    case PictureAlignment.RightCenter:
      x -= totalWidth;
      y -= heightInPoints / 2;
      break;
    case PictureAlignment.LeftBottom:
      y -= heightInPoints;
      break;
    case PictureAlignment.CenterBottom:
      x -= totalWidth / 2;
      y -= heightInPoints;
      break;
    case PictureAlignment.RightBottom:
      x -= totalWidth;
      y -= heightInPoints;
      break;
  }

  // Begin a new path
  const operators: PDFOperator[] = [];

  // Add rectangles for each bar in the pattern
  for (let i = 0; i < pattern.length; i++) {
    if (isDarkBar(i)) {
      // Draw rectangle (as a closed path)
      operators.push(rectangle(x, y, barWidth, heightInPoints));
    }
    x += barWidth;
  }

  // Fill all rectangles
  operators.push(fill());

  // Push all operators to the page
  pdf.pdfPage.pushOperators(...operators);
}

/**
 * Draws a QR code to the PDF stream.
 *
 * @param pdf The EasyPdfInternal instance
 * @param matrix The pre-encoded QR code matrix
 * @param options Options for rendering the QR code (optional)
 * @param options.size The width/height of the QR code in the current scale mode (default: 0.3" module size)
 * @param options.quietZone Whether to include the quiet zone (white space margin) around the QR code (default: true)
 * @param options.invert Whether to invert the colors of the QR code (dark becomes light, light becomes dark) (default: false)
 */
export function drawQRCode(
  pdf: EasyPdfInternal,
  matrix: QRCodeMatrix,
  options?: { size?: number; quietZone?: boolean; invert?: boolean }
): void {
  // Default options
  const includeQuietZone = options?.quietZone !== false;
  const invertColors = options?.invert === true;

  // Determine the module count and access method based on matrix type
  let moduleCount: number;
  let isDarkModule: (row: number, col: number) => boolean;

  if (Array.isArray(matrix) && Array.isArray(matrix[0])) {
    // Handle 2D boolean array
    moduleCount = matrix.length;
    isDarkModule = (row, col) => !!matrix[row]?.[col];
  } else if ("getModuleCount" in matrix && "isDark" in matrix) {
    // Handle object with getModuleCount() and isDark() methods
    moduleCount = matrix.getModuleCount();
    isDarkModule = (row, col) => !!matrix.isDark(row, col);
  } else if ("modules" in matrix && Array.isArray(matrix.modules) && Array.isArray(matrix.modules[0])) {
    // Handle object with modules property
    moduleCount = matrix.modules.length;
    isDarkModule = (row, col) => !!matrix.modules[row]?.[col];
  } else {
    throw new Error("Unrecognized QR code matrix format");
  }

  if (moduleCount <= 0) {
    throw new Error("QR code matrix cannot be empty");
  }

  // Detect if the QR code has a quiet zone by checking if any modules in the outer 4 rows/columns are dark
  const quietZoneWidth = 4; // Standard quiet zone is 4 modules wide
  let hasQuietZone = true;
  for (let x = 0; x < moduleCount; x++) {
    for (let y = 0; y < quietZoneWidth; y++) {
      if (isDarkModule(y, x) || isDarkModule(moduleCount - 1 - y, x) || isDarkModule(x, y) || isDarkModule(x, moduleCount - 1 - y)) {
        hasQuietZone = false;
        break;
      }
    }
    if (!hasQuietZone) break;
  }

  // Adjust moduleCount and isDarkModule based on quiet zone detection and includeQuietZone option
  if (hasQuietZone && !includeQuietZone) {
    // QR code has a quiet zone but we don't want to include it
    const oldIsDarkModule = isDarkModule;
    isDarkModule = (row, col) => oldIsDarkModule(row + quietZoneWidth, col + quietZoneWidth);
    moduleCount -= quietZoneWidth * 2;

    if (moduleCount <= 0) {
      throw new Error("QR code matrix is too small after removing quiet zone");
    }
  } else if (!hasQuietZone && includeQuietZone) {
    // QR code doesn't have a quiet zone but we want to include one
    const oldIsDarkModule = isDarkModule;
    const originalModuleCount = moduleCount;
    isDarkModule = (row, col) => {
      // If the position is in the quiet zone, return false (light module)
      if (
        row < quietZoneWidth ||
        row >= originalModuleCount + quietZoneWidth ||
        col < quietZoneWidth ||
        col >= originalModuleCount + quietZoneWidth
      ) {
        return false;
      }
      // Otherwise, map to the original QR code
      return oldIsDarkModule(row - quietZoneWidth, col - quietZoneWidth);
    };
    moduleCount += quietZoneWidth * 2;
  }

  // Apply inversion if requested
  if (invertColors) {
    const originalIsDarkModule = isDarkModule;
    isDarkModule = (row, col) => !originalIsDarkModule(row, col);
  }

  // Default size to 1 inch if not provided
  const moduleSize = options?.size !== undefined ? pdf.toPoints(options.size) / moduleCount : (72 / 100) * 3; // 0.03" module size by default
  const sizeInPoints = moduleSize * moduleCount;

  // Get current position
  let { x, y } = pdf.positionInternal;

  // Calculate position based on picture alignment
  switch (pdf.pictureAlignment) {
    case PictureAlignment.LeftTop:
      break;
    case PictureAlignment.CenterTop:
      x -= sizeInPoints / 2;
      break;
    case PictureAlignment.RightTop:
      x -= sizeInPoints;
      break;
    case PictureAlignment.LeftCenter:
      y -= sizeInPoints / 2;
      break;
    case PictureAlignment.CenterCenter:
      x -= sizeInPoints / 2;
      y -= sizeInPoints / 2;
      break;
    case PictureAlignment.RightCenter:
      x -= sizeInPoints;
      y -= sizeInPoints / 2;
      break;
    case PictureAlignment.LeftBottom:
      y -= sizeInPoints;
      break;
    case PictureAlignment.CenterBottom:
      x -= sizeInPoints / 2;
      y -= sizeInPoints;
      break;
    case PictureAlignment.RightBottom:
      x -= sizeInPoints;
      y -= sizeInPoints;
      break;
  }

  // Begin a new path
  const operators: PDFOperator[] = [];

  // Add single path with rectangles for each dark module in the QR code
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (isDarkModule(row, col)) {
        // Draw rectangle for this module
        operators.push(rectangle(x + col * moduleSize, y + row * moduleSize, moduleSize, moduleSize));
      }
    }
  }

  // Fill all rectangles
  operators.push(fill());

  // Push all operators to the page
  pdf.pdfPage.pushOperators(...operators);
}
