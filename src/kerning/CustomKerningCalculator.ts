import { CustomFontEmbedder } from "pdf-lib";
import { KerningPair } from "./KerningPair";

/**
 * Calculates kerning pairs for a string using a CustomFontEmbedder instance.
 *
 * This function uses the font's layout engine which already calculates kerning,
 * and returns an array of KerningPair objects with the appropriate adjustments.
 *
 * @param text - The text to calculate kerning for
 * @param embedder - The CustomFontEmbedder instance
 * @returns An array of KerningPair objects
 */
export function calculateKerningPairs(text: string, embedder: CustomFontEmbedder): KerningPair[] {
  if (!text || text.length === 0) {
    return [];
  }

  // Use the font's layout engine to get glyphs with kerning already calculated
  const layout = embedder.font.layout(text, embedder.fontFeatures);

  // Map glyphs to KerningPair objects
  const ret = layout.glyphs.map((glyph, index) => ({
    code: glyph.id,
    adjustment: (layout.positions[index].xAdvance - glyph.advanceWidth) * embedder.scale,
  }));
  return ret;
}

/**
 * Calculates the total width of text considering kerning.
 *
 * @param text - The text to calculate width for
 * @param embedder - The CustomFontEmbedder instance
 * @returns The total width in font units (1000ths) and the number of glyphs
 */
export function calculateKernedTextWidth(text: string, embedder: CustomFontEmbedder): { width: number; glyphCount: number } {
  if (!text || text.length === 0) {
    return { width: 0, glyphCount: 0 };
  }

  // Use the font's layout engine to get glyphs
  const layout = embedder.font.layout(text, embedder.fontFeatures);

  // Calculate the total width by summing the advance widths of all glyphs
  // The layout engine already accounts for kerning
  let totalWidth = 0;
  for (let idx = 0, len = layout.positions.length; idx < len; idx++) {
    totalWidth += layout.positions[idx].xAdvance * embedder.scale;
  }

  // Return the width in 1000ths of a unit and the number of glyphs
  return { width: totalWidth, glyphCount: layout.positions.length };
}
