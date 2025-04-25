import { EasyPdfInternal } from "../EasyPdfInternal";
import { fill, PDFOperator, rectangle } from "pdf-lib";
import { PictureAlignment } from "../PictureAlignment";

/**
 * Draws a barcode pattern to the PDF stream.
 *
 * @param pdf The EasyPdfInternal instance
 * @param pattern The barcode pattern as a string of 1's and 0's or true/false values
 * @param width The total width of the barcode in the current scale mode (optional)
 * @param height The height of the barcode in the current scale mode (optional)
 */
export function drawBarcode(pdf: EasyPdfInternal, pattern: string | boolean[], width?: number, height?: number): void {
  if (!pattern || pattern.length === 0) {
    throw new Error("Pattern cannot be empty");
  }

  // Default height to 0.5 inches if not provided
  const heightInPoints = height !== undefined ? pdf.toPoints(height) : 36; // 0.5 inches = 36 points

  // Calculate the width of each bar in points based on the total width or use a default width of 3 points
  const barWidth = width !== undefined ? pdf.toPoints(width) / pattern.length : 3;
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

  // Add rectangles for each '1' in the pattern
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "1" || pattern[i] === true) {
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
