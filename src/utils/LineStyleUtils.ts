import { PDFOperator, PDFOperatorNames, PDFNumber, PDFArray, PDFDocument, PDFPage } from "pdf-lib";
import { LineStyle, cloneLineStyle } from "../LineStyle";

/**
 * Applies the line style settings to a PDF page
 *
 * @param pdfPage - The PDF page to apply the line style to
 * @param lineStyle - The line style to apply
 * @param lastSetLineStyle - The last line style that was applied (or null if none)
 * @param pdfDocument - The PDF document (needed for context when creating arrays)
 * @returns The applied line style (for tracking the last set style)
 */
export function applyLineStyle(
  pdfPage: PDFPage,
  lineStyle: LineStyle,
  lastSetLineStyle: LineStyle | null,
  pdfDocument: PDFDocument
): LineStyle {
  // Create an array of operators
  const operators = [];

  // Check if line width has changed
  if (!lastSetLineStyle || lastSetLineStyle.width !== lineStyle.width) {
    operators.push(PDFOperator.of(PDFOperatorNames.SetLineWidth, [PDFNumber.of(lineStyle.width)]));
  }

  // Check if line cap style has changed
  if (!lastSetLineStyle || lastSetLineStyle.capStyle !== lineStyle.capStyle) {
    operators.push(PDFOperator.of(PDFOperatorNames.SetLineCapStyle, [PDFNumber.of(lineStyle.capStyle)]));
  }

  // Check if line join style has changed
  if (!lastSetLineStyle || lastSetLineStyle.joinStyle !== lineStyle.joinStyle) {
    operators.push(PDFOperator.of(PDFOperatorNames.SetLineJoinStyle, [PDFNumber.of(lineStyle.joinStyle)]));
  }

  // Check if dash style has changed
  const dashStyle = lineStyle.dashStyle;
  const dashStyleChanged =
    !lastSetLineStyle || lastSetLineStyle.dashStyle !== lineStyle.dashStyle || lastSetLineStyle.width !== lineStyle.width; // Width affects dash pattern

  if (dashStyleChanged) {
    // Create PDFArray for dash pattern
    const dashArray = PDFArray.withContext(pdfDocument.context);
    const multipliedArray = dashStyle.multipliedArray(lineStyle.width);

    // Add each number to the array
    for (const num of multipliedArray) {
      dashArray.push(PDFNumber.of(num));
    }

    const dashPhase = dashStyle.multipliedPhase(multipliedArray.length > 0 ? lineStyle.width : 0);

    // Add dash pattern operator
    operators.push(PDFOperator.of(PDFOperatorNames.SetLineDashPattern, [dashArray, PDFNumber.of(dashPhase)]));
  }

  // Push all operators at once (if any)
  if (operators.length > 0) {
    pdfPage.pushOperators(...operators);
  }

  // Return a clone of the applied line style
  return cloneLineStyle(lineStyle);
}
