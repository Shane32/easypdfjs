# easypdfjs

[![npm](https://img.shields.io/npm/v/easypdfjs.svg)](https://www.npmjs.com/package/easypdfjs)

A high-level, user-friendly PDF document creation library for JavaScript and TypeScript, built on top of pdf-lib.

## Basic setup

1. Install the package:

```bash
npm install easypdfjs pdf-lib
```

2. Create a new instance:

```javascript
// ESM
import { EasyPdf, ScaleMode } from 'easypdfjs';

// CommonJS
const { EasyPdf, ScaleMode } = require('easypdfjs');

// Create a new PDF document
const pdf = await EasyPdf.create();
```

3. Set the desired scaling mode:

```javascript
// Set scale mode to inches, points, or hundredths (default is hundredths)
pdf.scaleMode = ScaleMode.Inches;
```

4. Add a new page:

```javascript
// Create a letter-sized page (8.5" x 11") in portrait mode
pdf.newPage({
  width: 8.5,
  height: 11,
  landscape: false
});

// Create a letter-sized page with 1" margins
pdf.newPage({
  width: 8.5,
  height: 11,
  landscape: false,
  leftMargin: 1,
  rightMargin: 1,
  topMargin: 1,
  bottomMargin: 1
});
```

5. Add drawing instructions:

```javascript
pdf.writeLine("The quick brown fox jumps over the lazy dog");
```

6. Save the result:

```javascript
const pdfBytes = await pdf.save();

// In a browser environment, you can create a download link
const blob = new Blob([pdfBytes], { type: 'application/pdf' });
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = 'document.pdf';
link.click();

// In a Node.js environment, you can write to a file
const fs = require('fs');
fs.writeFileSync('document.pdf', pdfBytes);
```

## Properties

| Property                  | Description |
|---------------------------|-------------|
| scaleMode                 | Gets or sets the scaling mode for the coordinates used by all other commands |
| lineStyle                 | Gets or sets the style used to draw lines and borders |
| lineStyle.capStyle        | Gets or sets the style used to draw the end of a line |
| lineStyle.joinStyle       | Gets or sets the style used to draw joined line segments and borders |
| lineStyle.dashStyle       | Gets or sets the dash style used to draw lines and borders |
| lineStyle.width           | Gets or sets the pen width when drawing lines and borders |
| pageSize                  | Returns the size of the current page including margins |
| size                      | Returns the size of the current page excluding margins |
| margins                   | Gets or sets the current page's margins |
| position                  | Gets or sets the current drawing position |
| x                         | Gets or sets the current X position |
| y                         | Gets or sets the current Y position |
| foreColor                 | Gets or sets the color for printing text, lines and borders |
| fillColor                 | Gets or sets the color for filling polygons and drawing barcodes |
| font                      | Gets or sets the font name, size, and style used when writing text |
| font.familyName           | Gets or sets the font family name |
| font.embedded             | Indicates if the font is embedded into the document; false if it is a built-in font |
| font.size                 | Gets or sets the size of the font measured in points |
| font.bold                 | Gets or sets whether the font has the Bold style |
| font.italic               | Gets or sets whether the font has the Italic style |
| font.underline            | Gets or sets whether the font has the Underline style |
| font.strikeout            | Gets or sets whether the font has the Strikeout style |
| font.justify              | Gets or sets whether text is justified when word wrapping |
| font.lineSpacing          | Gets or sets the multiplier to adjust line spacing; defaults to 1.0 |
| font.hangingIndent        | Gets or sets the amount of indent for word-wrapped lines |
| font.paragraphSpacing     | Gets or sets the amount of space between paragraphs measured in points |
| font.stretchX             | Gets or sets the amount that text is stretched along the X axis |
| font.stretchY             | Gets or sets the amount that text is stretched along the Y axis |
| font.characterSpacing     | Gets or sets the amount of space between characters measured in points |
| pictureAlignment          | Gets or sets the alignment of pictures and barcodes in relation to the current position |
| textAlignment             | Gets or sets the alignment of text in relation to the current position |
| metadata                  | Gets or sets the document metadata |
| metadata.title            | Gets or sets the document title |
| metadata.author           | Gets or sets the document author |
| metadata.subject          | Gets or sets the document subject |
| metadata.keywords         | Gets or sets the document keywords |
| metadata.creator          | Gets or sets the document creator |
| metadata.creationDate     | Gets or sets the document creation date |
| metadata.modificationDate | Gets or sets the document modification date |
| metadata.producer         | Gets or sets the document producer |

Note that drawing coordinates are always specified or returned based on the current
`scaleMode` setting, and coordinate (0, 0) is the top-left corner of the page/margin.
Pen widths, font sizes, and paragraph spacing are always specified in points.

## Methods

Note that most methods may be chained, allowing to adjust position and execute a command in one line of code.

Example:

```javascript
pdf.moveTo(1, 1).writeLine("Hello there!");
pdf.offsetTo(0, 0.5).writeLine("Added a half inch gap between the lines");
```

### Document Setup

| Method           | Description |
|------------------|-------------|
| create           | Static method to create a new EasyPdf instance |
| newPage          | Creates a new page with specified dimensions and optional margins |
| save             | Saves the PDF document with all set metadata |
| saveState        | Saves the current drawing state and returns a function that can be used to restore it |
| offsetMargins    | Offsets the margins by the specified values |

### Position and Movement

| Method           | Description |
|------------------|-------------|
| moveTo           | Sets the current X and Y coordinates to the specified position |
| offsetTo         | Moves the current X and Y coordinates by the specified offset |

### Text Operations

| Method           | Description |
|------------------|-------------|
| write            | Writes one or more lines of text, leaving the current position positioned after the last character printed |
| writeLine        | Writes one or more lines of text, leaving the current position below the last line of text |
| textWidth        | Returns the width of the specified text |
| textHeight       | Returns the height of a single line of text |
| textCapHeight    | Returns the distance between the baseline and the top of capital letters |
| textAscent       | Returns the distance between the baseline and the top of the highest letters |
| textDescent      | Returns the distance between the baseline and the bottom of the lowest letters |
| textLeading      | Returns the amount of additional line spacing besides the ascent and descent |
| textParagraphLeading | Returns the amount of additional line spacing between paragraphs |

### Drawing Operations

| Method           | Description |
|------------------|-------------|
| lineTo           | Starts or continues a line or polygon to another specified coordinate |
| quadraticCurveTo | Adds a quadratic curve segment from the current position to the specified end point |
| bezierCurveTo    | Adds a cubic Bezier curve segment from the current position to the specified end point |
| finishLine       | Ends the line and draws it |
| finishPolygon    | Ends a polygon and draws it |
| circle           | Draws a circle at the current drawing position |
| ellipse          | Draws an ellipse at the current drawing position |
| rectangle        | Draws a rectangle at the current drawing position |
| cornerTo         | Adds a corner to the current path with optional bulge |

### Image Operations

| Method           | Description |
|------------------|-------------|
| paintPicture     | Paints a picture at the current drawing position |

### Barcode Operations

| Method           | Description |
|------------------|-------------|
| barcode          | Draws a barcode at the current drawing position |
| qrCode           | Draws a QR code at the current drawing position |

## Examples

### Text Formatting

```javascript
// Write "Hello world!" and advance to the next line
pdf.writeLine("Hello world!");

// Write "Hello world!" except with "world" in red
pdf.write("Hello ");
pdf.foreColor = { r: 1, g: 0, b: 0 }; // Red color
pdf.write("world");
pdf.foreColor = { r: 0, g: 0, b: 0 }; // Black color
pdf.writeLine("!");
pdf.x = 0;  // reposition cursor; otherwise it would be underneath the exclamation mark

// Center a header on the page
pdf.textAlignment = TextAlignment.CenterTop;
pdf.font = new Font("Times", 20);
pdf.moveTo(pdf.size.width / 2, 0.5).writeLine("Hello there!");

// Write a paragraph of text over 4" of horizontal space with justification
pdf.font.justify = true;
pdf.writeLine("Hello there! The quick brown fox jumps over the lazy dog. Did you know that?", 4);
```

### Drawing Shapes

```javascript
// Draw a rectangle
pdf.moveTo(1, 1).rectangle(2, 1);

// Draw a filled circle
pdf.moveTo(3, 3).circle(1, true, true);

// Draw a custom polygon
pdf.moveTo(1, 5)
  .lineTo(2, 5)
  .lineTo(2, 6)
  .lineTo(1, 6)
  .finishPolygon(true, true);
```

### Adding Images

```javascript
// In a browser environment
const imageUrl = 'path/to/image.jpg';
const response = await fetch(imageUrl);
const imageData = await response.arrayBuffer();
const image = await pdf.pdfDocument.embedJpg(imageData);

// In a Node.js environment
const fs = require('fs');
const imageData = fs.readFileSync('path/to/image.jpg');
const image = await pdf.pdfDocument.embedJpg(imageData);

// Add the image to the PDF, scaled to 3" in width
pdf.pictureAlignment = PictureAlignment.LeftTop;
pdf.scaleMode = ScaleMode.Inches;
pdf.paintPicture(image, { width: 3 });
```

### Adding Barcodes and QR Codes

```javascript
// Create a barcode pattern
import { createCode128 } from 'easypdfjs';
const barcodePattern = createCode128("12345678");

// Draw the barcode
pdf.moveTo(1, 1);
pdf.barcode(barcodePattern, { width: 2, height: 0.5 });

// Draw a QR code (requires a QR code generator library)
// Example using qrcode-generator
import qrcode from 'qrcode-generator';
const qr = qrcode(0, 'L');
qr.addData('https://example.com');
qr.make();

pdf.moveTo(1, 3);
pdf.qrCode(qr, { size: 2 });
```

Both barcode and QR code methods support additional options for customization. You can use the `invert` property to reverse the colors (dark becomes light, light becomes dark), which is useful for printing on dark backgrounds. The `quietZone` property controls whether to include white space margins around the code, which are typically required for reliable scanning:

```javascript
// Barcode with custom options
pdf.barcode(barcodePattern, {
  width: 2,
  height: 0.5,
  invert: false,    // Default is false
  quietZone: true   // Default is true
});

// QR code with custom options
pdf.qrCode(qr, {
  size: 2,
  invert: false,    // Default is false
  quietZone: true   // Default is true
});
```

## Standard Fonts

The library supports the five standard PDF fonts which do not require embedding:
- Times
- Helvetica
- Courier
- Symbol
- ZapfDingbats

For other fonts, you'll need to embed them using pdf-lib's font embedding capabilities.

## Font Embedding

The library supports embedding custom fonts for use in your PDF documents. Here's how to embed and use custom fonts:

```javascript
// First, register fontkit with the PDF document
import * as fontkit from '@pdf-lib/fontkit';
pdf.pdfDocument.registerFontkit(fontkit);

// In a browser environment
const fontUrl = 'path/to/font.ttf';
const fontResponse = await fetch(fontUrl);
const fontData = await fontResponse.arrayBuffer();
await pdf.pdfDocument.embedFont(fontData, { customName: 'MyCustomFont' });

// In a Node.js environment
const fs = require('fs');
const path = require('path');
const fontData = fs.readFileSync(path.join(__dirname, 'path/to/font.ttf'));
await pdf.pdfDocument.embedFont(fontData, { customName: 'MyCustomFont' });

// Now you can use the embedded font
pdf.font = new Font('MyCustomFont', 12);
pdf.writeLine('This text uses my custom font!');
```

You can also set various font properties:

```javascript
// Create a custom font with specific properties
const customFont = new Font('MyCustomFont', 14);
customFont.bold = true;
customFont.italic = true;
customFont.underline = true;
customFont.stretchX = 1.5;  // Stretch horizontally
customFont.lineSpacing = 1.2;  // Increase line spacing
customFont.characterSpacing = 0.5;  // Add space between characters
pdf.font = customFont;
```

## Credits

Glory to Jehovah, Lord of Lords and King of Kings, creator of Heaven and Earth, who through his Son Jesus Christ, has redeemed me to become a child of God. -Shane32