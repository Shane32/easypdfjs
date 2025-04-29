import { EasyPdf, PictureAlignment, ScaleMode } from "../src/index";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { rgb } from "pdf-lib";

// Ensure test-output directory exists
const TEST_OUTPUT_DIR = path.join(__dirname, "test-output");
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR);
}

describe("Picture Tests", () => {
  test("DrawImageWithDifferentSizingOptions", async () => {
    // Create a new PDF with inches as the scale mode
    const pdf = await EasyPdf.create({ scaleMode: ScaleMode.Inches });

    // Create a new 8.5x11 page
    pdf.newPage({
      width: 8.5,
      height: 11,
      landscape: false,
      topMargin: 0.5,
      leftMargin: 0.5,
    });

    // Load the sample image
    const imagePath = path.join(__dirname, "sample.png");
    const imageBytes = fs.readFileSync(imagePath);
    const image = await pdf.pdfDocument.embedPng(imageBytes);

    // Set blue color for boxes
    pdf.foreColor = rgb(0, 0, 1);
    pdf.lineStyle.width = 2;
    pdf.font.lineSpacing = 1.2;

    // 1. Draw the image with default size (96 DPI)
    pdf.moveTo(0, 0);
    pdf.writeLine("Default size (96 DPI):");
    pdf.paintPicture(image, {});
    pdf.rectangle(image.width / 96, image.height / 96);

    // 2. Draw the image specifying DPI (150 DPI)
    pdf.moveTo(0, 5);
    pdf.writeLine("DPI (150):");
    pdf.paintPicture(image, { dpi: 150 });
    pdf.rectangle(image.width / 150, image.height / 150);

    // 3. Draw the image specifying width (2 inches)
    pdf.moveTo(5, 0);
    pdf.writeLine("Width (2 inches):");
    pdf.paintPicture(image, { width: 2 });
    pdf.rectangle(2, (image.height / image.width) * 2);

    // 4. Draw the image specifying height (1 inch)
    pdf.moveTo(5, 3);
    pdf.writeLine("Height (1 inch):");
    pdf.paintPicture(image, { height: 1 });
    pdf.rectangle((image.width / image.height) * 1, 1);

    // 5. Draw the image specifying both width and height (2 inches x 1 inch)
    pdf.moveTo(5, 5);
    pdf.writeLine("Width (2 inches) and Height (1 inch):");
    pdf.paintPicture(image, { width: 2, height: 1 });
    pdf.rectangle(2, 1);

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

    // Assert the expected hash
    expect(hash).toBe("4d448ac44237e0def8b4a3605759644331ba997d1d7c1ca10e3e562aac313e0b");

    // Save PDF to file
    const outputFilePath = path.join(TEST_OUTPUT_DIR, "PictureTest.pdf");
    fs.writeFileSync(outputFilePath, pdfBytes);
    console.log(`PDF saved to: ${outputFilePath}`);
  });

  test("DrawImageWithDifferentAlignmentOptions", async () => {
    // Create a new PDF with inches as the scale mode
    const pdf = await EasyPdf.create({ scaleMode: ScaleMode.Inches });

    // Create a new 8.5x11 page
    pdf.newPage({
      width: 8.5,
      height: 11,
      landscape: false,
      topMargin: 0.5,
      leftMargin: 0.5,
    });

    // Load the sample image
    const imagePath = path.join(__dirname, "sample.png");
    const imageBytes = fs.readFileSync(imagePath);
    const image = await pdf.pdfDocument.embedPng(imageBytes);

    // Set blue color for boxes
    pdf.foreColor = rgb(0, 0, 1);
    pdf.fillColor = rgb(1, 0, 0);
    pdf.lineStyle.width = 0.01;

    // Draw title
    pdf.font.size = 14;
    pdf.moveTo(0, 0);
    pdf.writeLine("Picture Alignment Test - Page 1");
    pdf.font.size = 10;

    // Draw the image with default size (96 DPI)
    pdf.moveTo(0, 1);
    pdf.writeLine("Default size (96 DPI):");
    pdf.paintPicture(image, {});
    pdf.rectangle(image.width / 96, image.height / 96);

    // Create a new page for alignment tests
    pdf.newPage({
      width: 8.5,
      height: 11,
      landscape: false,
      topMargin: 0.5,
      leftMargin: 0.5,
    });

    // Draw title
    pdf.font.size = 14;
    pdf.moveTo(0, 0);
    pdf.writeLine("Picture Alignment Test - Page 2");
    pdf.font.size = 10;

    // Set up a grid for the 9 alignment options
    const gridWidth = 2.5;
    const gridHeight = 2.5;
    const imageWidth = 1; // Fixed width of 1 inch for all images

    // Draw grid for alignment tests
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = col * gridWidth;
        const y = 1 + row * gridHeight;

        // Draw grid cell
        pdf.moveTo(x, y);
        pdf.rectangle(gridWidth, gridHeight);

        // Calculate alignment option based on position
        const alignmentIndex = row * 3 + col;
        const alignment = alignmentIndex as PictureAlignment;

        // Set alignment
        pdf.pictureAlignment = alignment;

        // Draw image with fixed width
        pdf.moveTo(x + gridWidth / 2, y + gridHeight / 2);
        pdf.paintPicture(image, { width: imageWidth });

        // Draw circle to indicate alignment
        pdf.circle(0.08, false, true);

        // Add label for alignment
        pdf.moveTo(x + 0.1, y + 0.2);
        pdf.writeLine(PictureAlignment[alignment]);
      }
    }

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

    // Assert the expected hash
    expect(hash).toBe("ace34ec6bbe1deba55128cfeec9b779b844ac44c481e4299981b800e5afcf1c6");

    // Save PDF to file
    const outputFilePath = path.join(TEST_OUTPUT_DIR, "PictureAlignmentTest.pdf");
    fs.writeFileSync(outputFilePath, pdfBytes);
    console.log(`PDF saved to: ${outputFilePath}`);
  });
});
