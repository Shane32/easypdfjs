import { StandardFontEmbedder } from "pdf-lib";
import { KerningPair } from "./KerningPair";

/**
 * Interface representing a standard glyph with code and name properties.
 * This is used internally for kerning calculations.
 */
interface Glyph {
  code: number;
  name: string;
}

/**
 * Encodes text as an array of standard glyphs.
 *
 * @param embedder - The StandardFontEmbedder instance
 * @param text - The text to encode
 * @returns An array of StdGlyph objects
 */
function encodeTextAsGlyphs(embedder: StandardFontEmbedder, text: string): Glyph[] {
  const codePoints = Array.from(text);
  const glyphs: Glyph[] = new Array(codePoints.length);

  for (let idx = 0, len = codePoints.length; idx < len; idx++) {
    const codePoint = codePoints[idx].codePointAt(0)!;
    glyphs[idx] = embedder.encoding.encodeUnicodeCodePoint(codePoint);
  }

  return glyphs;
}

/**
 * Calculates kerning pairs for a string using a StandardFontEmbedder instance.
 *
 * This function analyzes the text and returns an array of KerningPair objects,
 * each containing the character code and the kerning adjustment to apply
 * before writing that character. The adjustment values are in 1000ths of a unit.
 *
 * The first character in the sequence will always have an adjustment of 0.
 *
 * @param text - The text to calculate kerning for
 * @param embedder - The StandardFontEmbedder instance
 * @returns An array of KerningPair objects
 */
export function calculateKerningPairs(text: string, embedder: StandardFontEmbedder): KerningPair[] {
  if (!text || text.length === 0) {
    return [];
  }

  // Encode the text as glyphs
  const glyphs = encodeTextAsGlyphs(embedder, text);

  // Create the result array
  const result: KerningPair[] = new Array(glyphs.length);

  // The first character always has zero adjustment
  result[0] = {
    code: glyphs[0].code,
    adjustment: 0,
  };

  // Calculate kerning for subsequent characters
  for (let i = 1; i < glyphs.length; i++) {
    const prevGlyph = glyphs[i - 1];
    const currGlyph = glyphs[i];

    // Get kerning amount between the previous and current glyph
    // The value is in 1000ths of a unit
    const kernAmount = embedder.font.getXAxisKerningForPair(prevGlyph.name, currGlyph.name) || 0;

    result[i] = {
      code: currGlyph.code,
      adjustment: kernAmount,
    };
  }

  return result;
}

/**
 * Calculates the total width of text considering kerning.
 *
 * @param text - The text to calculate width for
 * @param embedder - The StandardFontEmbedder instance
 * @returns The total width in font units (1000ths)
 */
export function calculateKernedTextWidth(text: string, embedder: StandardFontEmbedder): number {
  if (!text || text.length === 0) {
    return 0;
  }

  const glyphs = encodeTextAsGlyphs(embedder, text);
  let totalWidth = 0;

  for (let idx = 0, len = glyphs.length; idx < len; idx++) {
    const left = glyphs[idx].name;
    const right = (glyphs[idx + 1] || {}).name;
    const kernAmount = embedder.font.getXAxisKerningForPair(left, right) || 0;

    // Add the width of the current glyph plus any kerning adjustment
    const glyphWidth = embedder.font.getWidthOfGlyph(left) || 0; // Use 0 if undefined
    totalWidth += glyphWidth + kernAmount;
  }

  return totalWidth;
}
