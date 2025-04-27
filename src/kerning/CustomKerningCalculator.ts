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
  const { glyphs } = embedder.font.layout(text, embedder.fontFeatures);

  // Map glyphs to KerningPair objects
  return glyphs.map((glyph) => ({
    code: glyph.id,
    adjustment: (glyph.advanceWidth * embedder.scale) / 1000,
  }));
}

/**
 * Calculates the total width of text considering kerning.
 *
 * @param text - The text to calculate width for
 * @param embedder - The CustomFontEmbedder instance
 * @returns The total width in font units (1000ths)
 */
export function calculateKernedTextWidth(text: string, embedder: CustomFontEmbedder): number {
  if (!text || text.length === 0) {
    return 0;
  }

  // Use the font's layout engine to get glyphs
  const { glyphs } = embedder.font.layout(text, embedder.fontFeatures);

  // Calculate the total width by summing the advance widths of all glyphs
  // The layout engine already accounts for kerning
  let totalWidth = 0;
  for (let idx = 0, len = glyphs.length; idx < len; idx++) {
    totalWidth += glyphs[idx].advanceWidth * embedder.scale;
  }

  // Return the width in 1000ths of a unit
  return totalWidth;
}
