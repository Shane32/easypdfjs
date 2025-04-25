import {
  PDFHexString,
  PDFNumber,
  PDFArray,
  PDFOperator,
  PDFOperatorNames,
  StandardFontEmbedder,
  CustomFontEmbedder,
  PDFDocument,
} from "pdf-lib";
import type { Glyph } from "pdf-lib/cjs/types/fontkit";

// Define a type for font embedders
type FontEmbedder = StandardFontEmbedder | CustomFontEmbedder;

interface StdGlyph {
  code: number;
  name: string;
}

/**
 * Calculates kerning adjustments for a string, ready for use with the TJ operator.
 * Returns an array of alternating PDFHexString (text) and PDFNumber (kerning adjustment) objects.
 *
 * @param text The text to calculate kerning for
 * @param font The PDFFont or FontEmbedder to use
 * @param fontSize The font size in points
 * @returns An array of alternating text and kerning adjustments
 */
export function calculateKerningPairs(text: string, embedder: FontEmbedder, fontSize: number): (PDFHexString | PDFNumber)[] {
  // Scale factor to convert font units to text space units
  // In PDF, negative values move characters closer together
  const scaleFactor = -1000 / fontSize;

  // Result array for TJ operator (alternating text and kerning adjustments)
  const result: (PDFHexString | PDFNumber)[] = [];

  if (embedder instanceof StandardFontEmbedder) {
    // For standard fonts, we need to calculate kerning manually
    const glyphs = stdEncodeTextAsGlyphs(embedder, text);

    // Start with the first character
    let currentText = "";
    const currentGlyph = glyphs[0];
    currentText += String.fromCodePoint(currentGlyph.code);

    for (let i = 1; i < glyphs.length; i++) {
      const prevGlyph = glyphs[i - 1];
      const currGlyph = glyphs[i];

      // Get kerning amount between the previous and current glyph
      const kernAmount = embedder.font.getXAxisKerningForPair(prevGlyph.name, currGlyph.name) || 0;

      if (kernAmount !== 0) {
        // If there's kerning, add the current text chunk and the kerning adjustment
        result.push(embedder.encodeText(currentText));
        result.push(PDFNumber.of(kernAmount * scaleFactor));
        currentText = "";
      }

      // Add the current character to the text chunk
      currentText += String.fromCodePoint(currGlyph.code);
    }

    // Add any remaining text
    if (currentText.length > 0) {
      result.push(embedder.encodeText(currentText));
    }
  } else if (embedder instanceof CustomFontEmbedder) {
    // For custom fonts, we can use the font's layout engine
    const { glyphs } = embedder.font.layout(text, embedder.fontFeatures);

    if (glyphs.length === 0) {
      return result;
    }

    // Start with the first glyph
    const currentGlyphs: Glyph[] = [];

    // Process each glyph
    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];

      // If this isn't the first glyph, check for kerning
      if (i > 0 && i < glyphs.length - 1) {
        // Calculate the width of the current sequence of glyphs
        const currentSequenceWidth = currentGlyphs.reduce((sum, g) => sum + g.advanceWidth, 0);

        // Calculate what the width would be if we add the current glyph
        const widthWithCurrentGlyph = currentSequenceWidth + glyph.advanceWidth;

        // Get the next glyph
        const nextGlyph = glyphs[i + 1];

        // Calculate what the width would be if we add both the current and next glyph
        const widthWithNextGlyph = widthWithCurrentGlyph + nextGlyph.advanceWidth;

        // Layout the current sequence plus the next two glyphs to get the width with kerning
        const testText = text.substring(0, i + 2);
        const { glyphs: testGlyphs } = embedder.font.layout(testText, embedder.fontFeatures);
        const widthWithKerning = testGlyphs.reduce((sum, g) => sum + g.advanceWidth, 0);

        // Calculate the kerning adjustment
        const kernAdjustment = widthWithNextGlyph - widthWithKerning;

        if (Math.abs(kernAdjustment) > 0.01) {
          // Use a small threshold to account for floating-point errors
          // If there's significant kerning, add the current text chunk
          if (currentGlyphs.length > 0) {
            const textChunk = encodeGlyphs(currentGlyphs);
            result.push(textChunk);
            currentGlyphs.length = 0;
          }

          // Add the current glyph
          currentGlyphs.push(glyph);

          // Add the kerning adjustment
          result.push(PDFNumber.of(kernAdjustment * embedder.scale * scaleFactor));
          continue;
        }
      }

      // Add the current glyph to the chunk
      currentGlyphs.push(glyph);
    }

    // Add any remaining glyphs
    if (currentGlyphs.length > 0) {
      const textChunk = encodeGlyphs(currentGlyphs);
      result.push(textChunk);
    }
  }

  return result;

  // Helper function to encode glyphs for custom fonts
  function encodeGlyphs(glyphs: Glyph[]): PDFHexString {
    const hexCodes = glyphs.map((g) => {
      // Convert glyph ID to 4-digit hex string
      const hex = g.id.toString(16).padStart(4, "0");
      return hex;
    });
    return PDFHexString.of(hexCodes.join(""));
  }
}

/**
 * Creates a ShowTextAdjusted operator with kerning data for a string.
 *
 * @param text The text to create the operator for
 * @param font The PDFFont or FontEmbedder to use
 * @param fontSize The font size in points
 * @returns A PDFOperator for the TJ operation
 */
export function showTextAdjusted(text: string, doc: PDFDocument, fontEmbedder: FontEmbedder, fontSize: number): PDFOperator {
  // Calculate kerning pairs
  const kerningPairs = calculateKerningPairs(text, fontEmbedder, fontSize);

  // Create a PDF array with the kerning pairs
  const array = PDFArray.withContext(doc.context);
  for (const item of kerningPairs) {
    array.push(item);
  }

  // Return the TJ operator with the array
  return PDFOperator.of(PDFOperatorNames.ShowTextAdjusted, [array]);
}

function stdEncodeTextAsGlyphs(embedder: StandardFontEmbedder, text: string): StdGlyph[] {
  const codePoints = Array.from(text);
  const glyphs: StdGlyph[] = new Array(codePoints.length);
  for (let idx = 0, len = codePoints.length; idx < len; idx++) {
    const codePoint = codePoints[idx].codePointAt(0)!;
    glyphs[idx] = embedder.encoding.encodeUnicodeCodePoint(codePoint);
  }
  return glyphs;
}
