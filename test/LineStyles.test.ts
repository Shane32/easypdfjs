import { EasyPdf } from "../src/index";
import { ScaleMode } from "../src/ScaleMode";
import { LineJoinStyle } from "../src/LineJoinStyle";
import { LineCapStyle } from "../src/LineCapStyle";
import { LineDashStyle } from "../src/LineDashStyle";
import { rgb } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { assert } from "console";

// Ensure test-output directory exists
const TEST_OUTPUT_DIR = path.join(__dirname, "test-output");
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR);
}

describe("Line Styles Tests", () => {
  let pdf: EasyPdf;

  test("FillStyles", async () => {
    // Test different fill styles
    const pdf = await EasyPdf.create({ scaleMode: ScaleMode.Inches });
    pdf.newPage({ width: 8.5, height: 11 });
    pdf.margins = { left: 1, right: 1, top: 1, bottom: 1 };

    drawGeometricFigure(pdf, 0.5, false, false, false, false, 0.1, LineJoinStyle.Miter, 0, LineCapStyle.Butt);

    pdf.moveTo(3.75, 0);
    drawGeometricFigure(pdf, 0.5, true, true, false, false, 0.1, LineJoinStyle.Miter, 0, LineCapStyle.Butt);

    pdf.moveTo(0, 2);
    drawGeometricFigure(pdf, 0.5, true, false, true, false, 0.1, LineJoinStyle.Miter, 0, LineCapStyle.Butt);

    pdf.moveTo(3.75, 2);
    drawGeometricFigure(pdf, 0.5, true, false, true, true, 0.1, LineJoinStyle.Miter, 0, LineCapStyle.Butt);

    pdf.moveTo(0, 4);
    drawGeometricFigure(pdf, 0.5, true, true, true, true, 0.1, LineJoinStyle.Miter, 0, LineCapStyle.Butt);

    pdf.moveTo(3.75, 4);
    drawGeometricFigure(pdf, 0.5, true, true, true, false, 0.1, LineJoinStyle.Miter, 0, LineCapStyle.Butt);

    pdf.moveTo(0, 6);
    drawGeometricFigure(pdf, 0.5, true, false, false, false, 0.1, LineJoinStyle.Miter, 0, LineCapStyle.Butt);

    // Set fixed metadata to ensure deterministic PDF generation
    pdf.metadata.creationDate = new Date("2023-01-01T00:00:00.000Z");
    pdf.metadata.modificationDate = new Date("2023-01-01T00:00:00.000Z");
    pdf.metadata.producer = "EasyPdf Test";
    pdf.metadata.creator = "EasyPdf Test";

    // Save PDF
    const pdfBytes = await pdf.save();

    // Basic validation
    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(0);

    // Calculate SHA256 hash of the PDF bytes
    const hash = crypto.createHash("sha256").update(pdfBytes).digest("hex");

    // Expected hash value - this should be updated whenever the PDF generation changes intentionally
    const expectedHash = "842a55d1a5516a160022c610d5752e9be68a5d5cf9e813fe8686da53d927a4aa";

    // Verify hash matches expected value
    expect(hash).toBe(expectedHash);

    // Save PDF to file
    const outputFilePath = path.join(TEST_OUTPUT_DIR, "FillStyles.pdf");
    fs.writeFileSync(outputFilePath, pdfBytes);
    console.log(`PDF saved to: ${outputFilePath}`);
  });

  test("LineStyles", async () => {
    const pdf = await EasyPdf.create({ scaleMode: ScaleMode.Inches });
    pdf.newPage({ width: 8.5, height: 11 });
    pdf.margins = { left: 1, right: 1, top: 1, bottom: 1 };

    // Test different line styles
    pdf.moveTo(0, 0);
    drawGeometricFigure(pdf, 0.5, false, true, false, false, 0.1, LineJoinStyle.Miter, 0, LineCapStyle.Butt);
    pdf.moveTo(3.75, 0);
    drawGeometricFigure(pdf, 0.5, true, true, false, false, 0.1, LineJoinStyle.Miter, 0, LineCapStyle.Butt);

    pdf.moveTo(0, 2);
    drawGeometricFigure(pdf, 0.5, false, true, false, false, 0.0625 * 72, LineJoinStyle.Miter, 0, LineCapStyle.Butt);
    pdf.moveTo(3.75, 2);
    drawGeometricFigure(pdf, 0.5, true, true, false, false, 0.0625 * 72, LineJoinStyle.Miter, 0, LineCapStyle.Butt);

    pdf.moveTo(0, 4);
    drawGeometricFigure(pdf, 0.5, false, true, false, false, 0.0625 * 72, LineJoinStyle.Rounded, 0, LineCapStyle.Round);
    pdf.moveTo(3.75, 4);
    drawGeometricFigure(pdf, 0.5, true, true, false, false, 0.0625 * 72, LineJoinStyle.Rounded, 0, LineCapStyle.Round);

    pdf.moveTo(0, 6);
    drawGeometricFigure(pdf, 0.5, false, true, false, false, 0.0625 * 72, LineJoinStyle.Bevel, 0, LineCapStyle.Square);
    pdf.moveTo(3.75, 6);
    drawGeometricFigure(pdf, 0.5, true, true, false, false, 0.0625 * 72, LineJoinStyle.Bevel, 0, LineCapStyle.Square);

    pdf.lineStyle.width = 0.1;
    pdf.moveTo(0, 0);
    pdf.foreColor = rgb(0, 0, 1); // Blue
    pdf.lineTo(0, 8);

    // Create a new page for dash styles
    pdf.newPage({
      width: 8.5,
      height: 11,
      landscape: false,
      topMargin: 1,
      leftMargin: 1,
    });

    pdf.moveTo(0, 0);
    drawGeometricFigure(pdf, 0.5, false, true, false, false, 0.02 * 72, LineJoinStyle.Miter, 0, LineCapStyle.Butt);
    pdf.moveTo(3.75, 0);
    drawGeometricFigure(pdf, 0.5, false, true, false, false, 0.02 * 72, LineJoinStyle.Miter, 1, LineCapStyle.Butt);

    pdf.moveTo(0, 2);
    drawGeometricFigure(pdf, 0.5, false, true, false, false, 0.02 * 72, LineJoinStyle.Miter, 2, LineCapStyle.Butt);
    pdf.moveTo(3.75, 2);
    drawGeometricFigure(pdf, 0.5, false, true, false, false, 0.02 * 72, LineJoinStyle.Miter, 3, LineCapStyle.Butt);

    pdf.moveTo(0, 4);
    drawGeometricFigure(pdf, 0.5, false, true, false, false, 0.02 * 72, LineJoinStyle.Miter, 4, LineCapStyle.Butt);

    // Set fixed metadata to ensure deterministic PDF generation
    pdf.metadata.creationDate = new Date("2023-01-01T00:00:00.000Z");
    pdf.metadata.modificationDate = new Date("2023-01-01T00:00:00.000Z");
    pdf.metadata.producer = "EasyPdf Test";
    pdf.metadata.creator = "EasyPdf Test";

    // Save PDF
    const pdfBytes = await pdf.save();

    // Basic validation
    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(0);

    // Calculate SHA256 hash of the PDF bytes
    const hash = crypto.createHash("sha256").update(pdfBytes).digest("hex");
    console.log(`LineStyles PDF SHA256 hash: ${hash}`);

    // Expected hash value - this should be updated whenever the PDF generation changes intentionally
    const expectedHash = "3f87bc6a20c7cab0df9c86aec4d1eb281d7d108491489c978e165216843abf5f";

    // Verify hash matches expected value
    expect(hash).toBe(expectedHash);

    // Save PDF to file
    const outputFilePath = path.join(TEST_OUTPUT_DIR, "LineStyles.pdf");
    fs.writeFileSync(outputFilePath, pdfBytes);
    console.log(`PDF saved to: ${outputFilePath}`);
  });

  test("LineDashStylesCompare", async () => {
    const pdf = await EasyPdf.create({ scaleMode: ScaleMode.Inches });
    pdf.newPage({ width: 8.5, height: 11 });
    pdf.margins = { left: 1, right: 1, top: 1, bottom: 1 };

    const style1 = new LineDashStyle([1, 1, 2, 1, 3, 5], 5);
    expect(style1.array).toEqual([1, 1, 2, 1, 3, 5]);

    // Test immutability of array
    const originalArray = [...style1.array];
    style1.array[0] = 50;
    expect(style1.array).toEqual(originalArray);

    const style2 = new LineDashStyle([1, 1, 2, 1, 3, 5], 5);

    // Test equality
    expect(style1.array).toEqual(style2.array);
    expect(style1.phase).toEqual(style2.phase);

    const style3 = new LineDashStyle([1, 1, 2, 1, 3, 5], 6);
    expect(style1.phase).not.toEqual(style3.phase);

    const style4 = new LineDashStyle([1, 1, 2, 1, 3, 5, 6], 5);
    expect(style1.array).not.toEqual(style4.array);
  });
});

/**
 * Draws a geometric figure with specified parameters
 */
function drawGeometricFigure(
  pdf: EasyPdf,
  scale: number,
  close: boolean,
  border: boolean,
  fill: boolean,
  eofill: boolean,
  lineWidth: number,
  joinStyle: LineJoinStyle,
  dashStyle: number,
  capStyle: LineCapStyle
): void {
  const pos = { ...pdf.position };
  const len = 0.25 * scale;
  const leg = Math.sqrt(Math.pow(len, 2) / 2);

  pdf.foreColor = rgb(1, 0, 0); // Red
  pdf.lineStyle.width = lineWidth;
  pdf.lineStyle.joinStyle = joinStyle;

  if (dashStyle === 0) {
    pdf.lineStyle.dashStyle = LineDashStyle.Solid;
  } else if (dashStyle === 1) {
    pdf.lineStyle.dashStyle = LineDashStyle.Dash;
  } else if (dashStyle === 2) {
    pdf.lineStyle.dashStyle = LineDashStyle.DashDotDot;
  } else if (dashStyle === 3) {
    pdf.lineStyle.dashStyle = LineDashStyle.Dot;
  } else if (dashStyle === 4) {
    pdf.lineStyle.dashStyle = new LineDashStyle([1, 1, 2, 1, 3, 5], 5);
  }

  pdf.lineStyle.capStyle = capStyle;

  pdf
    .lineTo(1 * scale, 0)
    .cornerTo(0.25 * scale, 0.25 * scale, false)
    .lineTo(0, 0.5 * scale)
    .quadraticCurveTo({ x: 0, y: 0.25 * scale }, { x: 0.25 * scale, y: 0.25 * scale })
    .lineTo(0.5 * scale, 0)
    .quadraticCurveTo({ x: 0.25 * scale, y: 0 }, { x: 0.25 * scale + leg, y: leg })
    .lineTo(0.5 * scale, 0.5 * scale)
    .bezierCurveTo({ x: 0.25 * scale, y: 0.25 * scale }, { x: 0.75 * scale, y: -0.25 * scale }, { x: 1 * scale, y: 0 })
    .lineTo(0, 1 * scale)
    .lineTo(-2 * scale, 0)
    .lineTo(0, 0.5 * scale)
    .lineTo(0.5 * scale, 0)
    .lineTo(0, -1 * scale)
    .lineTo(0.5 * scale, 0)
    .lineTo(0, 1.5 * scale)
    .lineTo(-1 * scale, 0)
    .cornerTo(-0.25 * scale, -0.25 * scale, true);

  if (close) {
    pdf.finishPolygon(border, fill, eofill);
    expect(pdf.position).toEqual(pos);
  } else {
    pdf.finishLine();
    expect(pdf.position).not.toEqual(pos);
  }

  pdf.moveTo(pos.x, pos.y);
  pdf.offsetTo(4.5 * scale, 0).rectangle(1 * scale, 0.4 * scale, 0, border, fill);
  pdf.offsetTo(0, 0.7 * scale).rectangle(1 * scale, 0.5 * scale, 0.2 * scale, border, fill);
  pdf.offsetTo(0, 0.8 * scale).rectangle({
    width: 1 * scale,
    height: 0.7 * scale,
    inset: 0.15 * scale,
    borderRadius: 0,
  });
  pdf.offsetTo(0, 1 * scale).rectangle({
    width: 1 * scale,
    height: 0.7 * scale,
    inset: 0.15 * scale,
    borderRadius: 0.05,
  });
}
