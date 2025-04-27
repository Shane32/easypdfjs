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
import { KerningPair } from "../kerning/KerningPair";
import * as standardKerningCalculator from "../kerning/StandardKerningCalculator";
import * as customKerningCalculator from "../kerning/CustomKerningCalculator";

// Define a type for font embedders
type FontEmbedder = StandardFontEmbedder | CustomFontEmbedder;

/**
 * Calculates kerning adjustments for a string, ready for use with the TJ operator.
 * Returns an array of alternating PDFHexString (text) and PDFNumber (kerning adjustment) objects.
 *
 * @param text The text to calculate kerning for
 * @param font The PDFFont or FontEmbedder to use
 * @returns An array of alternating text and kerning adjustments
 */
export function calculateKerningPairs(text: string, embedder: FontEmbedder): (PDFHexString | PDFNumber)[] {
  // Result array for TJ operator (alternating text and kerning adjustments)
  const result: (PDFHexString | PDFNumber)[] = [];

  // Get kerning pairs from the appropriate calculator
  let kerningPairs: KerningPair[];
  let hexLength: number;

  if (embedder instanceof StandardFontEmbedder) {
    // Use the StandardKerningCalculator for standard fonts
    kerningPairs = standardKerningCalculator.calculateKerningPairs(text, embedder);
    hexLength = 2; // Standard fonts use 2-digit hex codes
  } else if (embedder instanceof CustomFontEmbedder) {
    // Use the CustomKerningCalculator for custom fonts
    kerningPairs = customKerningCalculator.calculateKerningPairs(text, embedder);
    hexLength = 4; // Custom fonts use 4-digit hex codes
  } else {
    // Fallback for unknown font types
    throw new Error("Unsupported font embedder type");
  }

  if (kerningPairs.length === 0) {
    return result;
  }

  // Compress the kerning pairs to reduce the number of operations
  kerningPairs = compressKerningPairs(kerningPairs);

  // Process the kerning pairs to create the TJ operator array
  // Add the first character (which always has zero adjustment)
  const firstPair = kerningPairs[0];
  if (firstPair) {
    // Convert the code to hex and add it to the result
    const hex = convertCodesToHex(firstPair.code, hexLength);
    result.push(PDFHexString.of(hex));
  }

  // Process the rest of the pairs
  for (let i = 1; i < kerningPairs.length; i++) {
    const pair = kerningPairs[i];
    const adjustment = pair.adjustment;

    // Add the adjustment
    result.push(PDFNumber.of(-adjustment));

    // Add the character code as hex
    const hex = convertCodesToHex(pair.code, hexLength);
    result.push(PDFHexString.of(hex));
  }

  return result;
}

/**
 * Creates a ShowTextAdjusted operator with kerning data for a string.
 *
 * @param text The text to create the operator for
 * @param font The PDFFont or FontEmbedder to use
 * @param fontSize The font size in points
 * @returns A PDFOperator for the TJ operation
 */
export function showTextAdjusted(text: string, doc: PDFDocument, fontEmbedder: FontEmbedder): PDFOperator {
  // Calculate kerning pairs (already compressed by calculateKerningPairs)
  const kerningPairs = calculateKerningPairs(text, fontEmbedder);

  // Create a PDF array with the kerning pairs
  const array = PDFArray.withContext(doc.context);
  for (const item of kerningPairs) {
    array.push(item);
  }

  // Return the TJ operator with the array
  return PDFOperator.of(PDFOperatorNames.ShowTextAdjusted, [array]);
}

/**
 * Compresses an array of KerningPairs by joining consecutive codes when their adjustments are 0.
 *
 * This function takes an array of KerningPairs and looks for pairs with zero adjustment.
 * When a pair has zero adjustment, its code is joined with the previous pair's code.
 * This can reduce the number of operations needed when rendering text.
 *
 * @param pairs The array of KerningPairs to compress
 * @returns A new array of compressed KerningPairs
 */
export function compressKerningPairs(pairs: KerningPair[]): KerningPair[] {
  // Handle empty or single-element arrays
  if (pairs.length <= 1) {
    return pairs;
  }

  const result: KerningPair[] = [];
  let currentPair: KerningPair | null = null;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];

    if (currentPair === null) {
      // First pair is always added to the result
      currentPair = { ...pair };
      result.push(currentPair);
      continue;
    }

    if (pair.adjustment === 0) {
      // If the current pair has zero adjustment, join its code with the previous pair's code
      const prevCode = currentPair.code;
      const currCode = pair.code;

      // Create a combined code array
      if (Array.isArray(prevCode) && Array.isArray(currCode)) {
        // Both are arrays, concatenate them
        currentPair.code = [...prevCode, ...currCode];
      } else if (Array.isArray(prevCode)) {
        // Previous is array, current is single
        currentPair.code = [...prevCode, currCode as number];
      } else if (Array.isArray(currCode)) {
        // Previous is single, current is array
        currentPair.code = [prevCode as number, ...currCode];
      } else {
        // Both are single numbers
        currentPair.code = [prevCode as number, currCode as number];
      }
    } else {
      // If the current pair has non-zero adjustment, add it to the result
      currentPair = { ...pair };
      result.push(currentPair);
    }
  }

  return result;
}

/**
 * Converts a code or array of codes to hex string.
 *
 * @param code The code or array of codes to convert
 * @param hexLength The number of digits for each hex code (2 for standard fonts, 4 for custom fonts)
 * @returns A hex string representation of the code(s)
 */
function convertCodesToHex(code: number | number[], hexLength: number): string {
  if (Array.isArray(code)) {
    // Handle array of codes by converting each one and concatenating
    return code
      .map((c) => c.toString(16).padStart(hexLength, "0"))
      .join("")
      .toUpperCase();
  } else {
    // Handle single code
    return code.toString(16).padStart(hexLength, "0").toUpperCase();
  }
}
