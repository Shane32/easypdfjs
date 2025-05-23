import {
  Color,
  CustomFontEmbedder,
  PDFFont,
  PDFName,
  StandardFonts as pdfStandardFonts,
  StandardFontEmbedder,
  PDFOperator,
  pushGraphicsState,
  popGraphicsState,
  beginText,
  endText,
  setFontAndSize,
  setTextMatrix,
  setCharacterSpacing,
  setWordSpacing,
  setTextRenderingMode,
  TextRenderingMode,
  setLineWidth,
  rectangle,
  fill,
  setLineCap,
  LineCapStyle,
  setDashPattern,
  setLineJoin,
  LineJoinStyle,
  setFillingColor,
  setStrokingColor,
} from "pdf-lib";
import { showTextAdjusted } from "./FontKerningUtils";
import { EasyPdfInternal } from "../EasyPdfInternal";
import { StandardFonts } from "../StandardFonts";
import { TextAlignment } from "../TextAlignment";
import { calculateKernedTextWidth } from "../kerning/CustomKerningCalculator";
type FontEmbedder = CustomFontEmbedder | StandardFontEmbedder;

/**
 * Retrieves or embeds a font for the PDF document.
 *
 * This function handles both standard and custom fonts, ensuring the font is properly
 * embedded in the PDF document. It supports different variations of standard fonts
 * (bold, italic, bold-italic) and handles custom font embedding.
 *
 * @param {EasyPdfInternal} easyPdf - The internal PDF document context
 * @returns {Object} An object containing the PDF font and its style properties
 * @returns {PDFFont} .font - The embedded PDF font
 * @returns {boolean} .bold - Indicates if the font is bold
 * @returns {boolean} .italic - Indicates if the font is italic
 * @throws {Error} If a custom font is not found in the document
 */
function getFont(easyPdf: EasyPdfInternal): { font: PDFFont; bold: boolean; italic: boolean } {
  const font = easyPdf.font;
  // Get the list of fonts already embedded in the PDF document
  const doc = easyPdf.pdfDocument;
  const docFonts = (doc as unknown as { fonts: PDFFont[] }).fonts;

  // Determine if the font is built-in or custom
  const fontName = font.familyName;
  if (!font.embedded) {
    // Determine the exact font name used in the PDF document based on the family name, bold, and italic properties
    let isBold = font.bold;
    let isItalic = font.italic;
    let fullFontName: pdfStandardFonts;
    if (fontName === StandardFonts.Courier) {
      fullFontName =
        isBold && isItalic
          ? pdfStandardFonts.CourierBoldOblique
          : isBold
          ? pdfStandardFonts.CourierBold
          : isItalic
          ? pdfStandardFonts.CourierOblique
          : pdfStandardFonts.Courier;
      isBold = false;
      isItalic = false;
    } else if (fontName === StandardFonts.Helvetica) {
      fullFontName =
        isBold && isItalic
          ? pdfStandardFonts.HelveticaBoldOblique
          : isBold
          ? pdfStandardFonts.HelveticaBold
          : isItalic
          ? pdfStandardFonts.HelveticaOblique
          : pdfStandardFonts.Helvetica;
      isBold = false;
      isItalic = false;
    } else if (fontName === StandardFonts.Times) {
      fullFontName =
        isBold && isItalic
          ? pdfStandardFonts.TimesRomanBoldItalic
          : isBold
          ? pdfStandardFonts.TimesRomanBold
          : isItalic
          ? pdfStandardFonts.TimesRomanItalic
          : pdfStandardFonts.TimesRoman;
      isBold = false;
      isItalic = false;
    } else if (fontName === StandardFonts.Symbol) {
      fullFontName = pdfStandardFonts.Symbol;
    } else if (fontName === StandardFonts.ZapfDingbats) {
      fullFontName = pdfStandardFonts.ZapfDingbats;
    } else {
      throw new Error(`Font ${fontName} is not a standard font.`);
    }
    for (const pdfFont of docFonts) {
      if (pdfFont.name === fullFontName) {
        return { font: pdfFont, bold: false, italic: false };
      }
    }
    // If the font is not found, embed it
    return {
      font: doc.embedStandardFont(fullFontName),
      bold: isBold,
      italic: isItalic,
    };
  } else {
    for (const pdfFont of docFonts) {
      const embedder = (pdfFont as unknown as { embedder: FontEmbedder }).embedder;
      if (embedder.customName !== undefined ? embedder.customName === fontName : pdfFont.name === fontName) {
        return { font: pdfFont, bold: font.bold, italic: font.italic };
      }
    }
    throw new Error(`Font ${fontName} not found in the document. Please embed the font before using it.`);
  }
}

/**
 * Calculates the width of a given text string in points.
 * Includes character spacing and kerning adjustments.
 * Includes character spacing after the last character.
 */
export function getTextWidth(easyPdf: EasyPdfInternal, text: string): number {
  if (text.length === 0) {
    return 0;
  }
  const font = easyPdf.font;
  const { font: pdfFont } = getFont(easyPdf);
  if (font.embedded) {
    // For embedded fonts, use the custom kerning calculator to get the width
    const calc = calculateKernedTextWidth(text, (pdfFont as unknown as { embedder: CustomFontEmbedder }).embedder);
    let width = (calc.width / 1000) * font.size;
    width += calc.glyphCount * font.characterSpacing;
    return easyPdf.fromPoints(width * font.stretchX);
  } else {
    const textWidth = pdfFont.widthOfTextAtSize(text, font.size);
    const characterSpacing = text.length * font.characterSpacing;
    return easyPdf.fromPoints((textWidth + characterSpacing) * font.stretchX);
  }
}

export function getTextHeight(easyPdf: EasyPdfInternal): number {
  const font = easyPdf.font;
  const { font: pdfFont } = getFont(easyPdf);
  const { height } = getFontDimensions(pdfFont, font.size);
  return easyPdf.fromPoints(height * font.lineSpacing * font.stretchY);
}

export function getTextCapHeight(easyPdf: EasyPdfInternal): number {
  const font = easyPdf.font;
  const { font: pdfFont } = getFont(easyPdf);
  const { capHeight } = getFontDimensions(pdfFont, font.size);
  return easyPdf.fromPoints(capHeight * font.stretchY);
}

export function getTextAscent(easyPdf: EasyPdfInternal): number {
  const font = easyPdf.font;
  const { font: pdfFont } = getFont(easyPdf);
  const { ascent } = getFontDimensions(pdfFont, font.size);
  return easyPdf.fromPoints(ascent * font.stretchY);
}

export function getTextDescent(easyPdf: EasyPdfInternal): number {
  const font = easyPdf.font;
  const { font: pdfFont } = getFont(easyPdf);
  const { descent } = getFontDimensions(pdfFont, font.size);
  return easyPdf.fromPoints(descent * font.stretchY);
}

export function getTextLeading(easyPdf: EasyPdfInternal): number {
  const font = easyPdf.font;
  const { font: pdfFont } = getFont(easyPdf);
  const { leading, height } = getFontDimensions(pdfFont, font.size);
  // Calculate leading based on lineSpacing property
  const heightAdjustment = height * (font.lineSpacing - 1);
  // Calculate total leading -- font leading plus extra due to lineSpacing
  const totalLeading = leading + heightAdjustment;
  return easyPdf.fromPoints(totalLeading * font.stretchY);
}

export function getTextParagraphLeading(easyPdf: EasyPdfInternal): number {
  return easyPdf.fromPoints(easyPdf.font.paragraphSpacing);
}

/**
 * Calculates detailed font metrics for both standard and custom fonts.
 *
 * Extracts font dimensions such as ascent, descent, cap height,
 * leading, and total height based on the font type and specified size.
 * Supports both StandardFontEmbedder and CustomFontEmbedder.
 *
 * @param {PDFFont} font - The PDF font to analyze
 * @param {number} fontSize - The size of the font in points
 * @returns {Object} An object containing precise font dimension metrics in points
 * @returns {number} .ascent - Distance from baseline to the top of the tallest character in points
 * @returns {number} .descent - Distance from baseline to the bottom of the lowest descending character in points
 * @returns {number} .capHeight - Height of capital letters in points
 * @returns {number} .leading - Vertical space between lines in points
 * @returns {number} .height - Total font height (ascent - descent + line gap) in points
 * @returns {number} .underlinePosition - Position of the underline relative to the baseline in points
 * @returns {number} .underlineThickness - Thickness of the underline in points
 * @throws {Error} If an unknown or unsupported font embedder type is encountered
 */
function getFontDimensions(
  font: PDFFont,
  fontSize: number
): {
  ascent: number;
  descent: number;
  capHeight: number;
  leading: number;
  height: number;
  underlinePosition: number;
  underlineThickness: number;
} {
  const embedder = (font as unknown as { embedder: FontEmbedder }).embedder;
  if (embedder instanceof StandardFontEmbedder) {
    const standardFontEmbedder = embedder as StandardFontEmbedder;
    const font = standardFontEmbedder.font;
    const ascent = ((font.Ascender ?? font.FontBBox[3]) * fontSize) / 1000;
    const descent = ((font.Descender ?? font.FontBBox[1]) * fontSize) / 1000;
    const capHeight = ((font.CapHeight ?? ascent * 0.9) * fontSize) / 1000;
    const underlinePosition = ((font.UnderlinePosition ?? -100) * fontSize) / 1000;
    const underlineThickness = ((font.UnderlineThickness ?? 50) * fontSize) / 1000;
    const height = ascent - descent;
    return { ascent, descent, capHeight, leading: 0, height, underlinePosition, underlineThickness };
  } else if (embedder instanceof CustomFontEmbedder) {
    const customFontEmbedder = embedder as CustomFontEmbedder;
    const font = customFontEmbedder.font;
    const ascent = ((font.ascent * fontSize) / 1000) * embedder.scale;
    const descent = ((font.descent * fontSize) / 1000) * embedder.scale;
    const capHeight = ((font.capHeight * fontSize) / 1000) * embedder.scale;
    const lineGap = ((font.lineGap * fontSize) / 1000) * embedder.scale;
    const height = ascent - descent + lineGap;
    const underlinePosition = (((font.underlinePosition ?? -100) * fontSize) / 1000) * embedder.scale;
    const underlineThickness = (((font.underlineThickness ?? 50) * fontSize) / 1000) * embedder.scale;
    return { ascent, descent, capHeight, leading: lineGap, height, underlinePosition, underlineThickness };
  } else {
    throw new Error("Unknown font embedder type");
  }
}

/**
 * Writes multiple lines of text to a PDF document with advanced formatting options.
 *
 * This function handles text rendering across multiple lines, supporting:
 * - Automatic line splitting for multi-line text
 * - Optional text wrapping within a specified width
 * - Paragraph spacing and line positioning
 *
 * @param {EasyPdfInternal} easyPdf - The internal PDF document context containing
 *        font settings, page information, and rendering parameters
 * @param {string} text - The text to be written, which may contain multiple lines
 * @param {boolean} newLine - Indicates whether to start a new line after
 *        completing the text rendering process. If true, paragraph spacing will be added
 * @param {number} [width] - Optional maximum width for text wrapping. If provided,
 *        text will be automatically wrapped to fit within this width
 *
 * @example
 * // Write a simple multi-line text
 * writeLines(easyPdf, "Hello\nWorld", true);
 *
 * @example
 * // Write a text with wrapping
 * writeLines(easyPdf, "This is a long text that will be wrapped", true, 100);
 */
export function writeLines(easyPdf: EasyPdfInternal, text: string, newLine: boolean, width?: number): void {
  const lines = text.split(/\r\n|\r|\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // only pass newLine if this is the last line; otherwise pass true
    const thisNewLine = newLine || i < lines.length - 1;
    if (width !== undefined) {
      writeWrapped(easyPdf, line, thisNewLine, width);
    } else {
      writeLineInternal(easyPdf, getFont(easyPdf), line, thisNewLine, false);
      if (thisNewLine) {
        easyPdf.offsetTo(0, easyPdf.font.paragraphSpacing); // add paragraph spacing
      }
    }
  }
}

/**
 * Handles text wrapping for a given text within a specified width.
 *
 * This function is designed to break text into multiple lines when it exceeds
 * the specified maximum width. It takes into account font characteristics
 * such as line spacing, stretching, and font dimensions.
 *
 * @param {EasyPdfInternal} easyPdf - The internal PDF document context containing
 *        font settings, page information, and rendering parameters
 * @param {string} text - The text to be wrapped into multiple lines
 * @param {boolean} newLine - Indicates whether to start a new line after
 *        completing the text wrapping process
 * @param {number} width - The maximum width (in document units) within which
 *        the text should be wrapped
 * @remarks Currently a stub implementation awaiting full text wrapping logic
 */
function writeWrapped(easyPdf: EasyPdfInternal, text: string, newLine: boolean, width: number): void {
  if (text.length === 0) {
    if (newLine) {
      easyPdf.offsetTo(0, getTextHeight(easyPdf) + easyPdf.font.paragraphSpacing);
    }
    return;
  }

  const fontInfo = getFont(easyPdf);

  // Split text into words
  const words = text.split(" ");

  let currentLine: string[] = [];
  let currentLineWidth = 0;
  let isFirstLine = true;

  const spaceWidth = getTextWidth(easyPdf, " ");
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let potentialLineWidth: number;
    let wordWidth: number = 0;
    if (easyPdf.font.embedded) {
      wordWidth = getTextWidth(easyPdf, word);
      potentialLineWidth = currentLineWidth + (currentLine.length > 0 ? spaceWidth : 0) + wordWidth;
    } else {
      potentialLineWidth = getTextWidth(easyPdf, currentLine.join(" ") + " " + word);
    }
    // remove final character spacing from the potential line width
    potentialLineWidth -= easyPdf.fromPoints(easyPdf.font.characterSpacing * easyPdf.font.stretchX);

    // If adding this word would exceed the width, write the current line
    if (currentLine.length > 0 && potentialLineWidth > width) {
      const lineText = currentLine.join(" ");

      // Write the line with justification for all but the last line
      writeLineInternal(easyPdf, fontInfo, lineText, true, !isFirstLine, width);

      // Reset current line
      currentLine = [];
      currentLineWidth = 0;
      isFirstLine = false;
    }

    // Add word to current line
    currentLine.push(word);
    currentLineWidth += (currentLine.length > 1 ? spaceWidth : 0) + wordWidth;
  }

  // Write the last line if there are remaining words
  const lineText = currentLine.join(" ");
  writeLineInternal(easyPdf, fontInfo, lineText, newLine, !isFirstLine, undefined);

  if (newLine) {
    // add paragraph spacing now that the wrapped line is complete
    easyPdf.offsetTo(0, easyPdf.font.paragraphSpacing);
  }
}

/**
 * Writes a single line of text with advanced positioning and formatting options.
 *
 * This function handles text rendering with complex alignment, justification,
 * and positioning logic. It supports various text alignment modes,
 * optional indentation, and text justification.
 *
 * Text is assumed to not have any line breaks, and no word wrapping is performed.
 *
 * The current position of EasyPdf is updated after writing the text.
 * However, no paragraph spacing is added after the text; only line spacing.
 *
 * @param {EasyPdfInternal} easyPdf - The internal PDF document context
 * @param {Object} fontInfo - Detailed information about the font
 * @param {PDFFont} fontInfo.font - The PDF font to be used
 * @param {boolean} fontInfo.bold - Indicates if the font should be rendered in bold
 * @param {boolean} fontInfo.italic - Indicates if the font should be rendered in italic
 * @param {string} text - The text to be written
 * @param {boolean} newLine - Whether to move to a new line after writing the text
 * @param {boolean} indent - Whether to apply hanging indent to the text (for left-aligned text only)
 * @param {number} [justifyWidth] - Optional width for text justification in points
 * @remarks Currently a stub implementation, awaiting full text writing logic
 */
function writeLineInternal(
  easyPdf: EasyPdfInternal,
  fontInfo: { font: PDFFont; bold: boolean; italic: boolean },
  text: string,
  newLine: boolean,
  indent: boolean,
  justifyWidth?: number
): void {
  const font = easyPdf.font;

  if (text.length === 0) {
    if (newLine) {
      easyPdf.offsetTo(0, getTextHeight(easyPdf)); // does not add paragraph spacing
    }
    return;
  }

  // Determine width in points
  let width: number = getTextWidth(easyPdf, text);
  let wordSpacing: number = 0;
  if (font.justify && justifyWidth !== undefined) {
    width -= easyPdf.fromPoints(easyPdf.font.characterSpacing * easyPdf.font.stretchX);
    // count number of spaces in the text
    const spaceCount = text.split(" ").length - 1;
    if (spaceCount > 0) {
      wordSpacing = (justifyWidth - width) / spaceCount / font.stretchX;
      width = justifyWidth;
    }
  }

  // Determine X coordinate
  let x: number = easyPdf.position.x;
  if (
    easyPdf.textAlignment === TextAlignment.LeftBaseline ||
    easyPdf.textAlignment === TextAlignment.LeftTop ||
    easyPdf.textAlignment === TextAlignment.LeftBottom ||
    easyPdf.textAlignment === TextAlignment.LeftCenter
  ) {
    x += indent ? font.hangingIndent : 0;
  } else if (
    easyPdf.textAlignment === TextAlignment.CenterBaseline ||
    easyPdf.textAlignment === TextAlignment.CenterTop ||
    easyPdf.textAlignment === TextAlignment.CenterBottom ||
    easyPdf.textAlignment === TextAlignment.CenterCenter
  ) {
    x -= width / 2;
  } else if (
    easyPdf.textAlignment === TextAlignment.RightBaseline ||
    easyPdf.textAlignment === TextAlignment.RightTop ||
    easyPdf.textAlignment === TextAlignment.RightBottom ||
    easyPdf.textAlignment === TextAlignment.RightCenter
  ) {
    x -= width;
  }

  // Determine Y coordinate
  let y: number = easyPdf.position.y;
  if (
    easyPdf.textAlignment === TextAlignment.LeftTop ||
    easyPdf.textAlignment === TextAlignment.CenterTop ||
    easyPdf.textAlignment === TextAlignment.RightTop
  ) {
    y += getTextAscent(easyPdf);
  } else if (
    easyPdf.textAlignment === TextAlignment.LeftCenter ||
    easyPdf.textAlignment === TextAlignment.CenterCenter ||
    easyPdf.textAlignment === TextAlignment.RightCenter
  ) {
    y += getTextCapHeight(easyPdf) / 2;
  } else if (
    easyPdf.textAlignment === TextAlignment.LeftBottom ||
    easyPdf.textAlignment === TextAlignment.CenterBottom ||
    easyPdf.textAlignment === TextAlignment.RightBottom
  ) {
    y -= getTextHeight(easyPdf) - getTextAscent(easyPdf);
  }

  // Draw text
  drawTextWithWordSpacing(
    easyPdf,
    text,
    easyPdf.toPoints(x),
    easyPdf.toPoints(y),
    easyPdf.toPoints(width),
    fontInfo.font,
    font.size,
    easyPdf.foreColor,
    easyPdf.toPoints(wordSpacing),
    font.characterSpacing,
    font.stretchX,
    font.stretchY,
    fontInfo.bold,
    fontInfo.italic,
    font.underline,
    font.strikeout
  );

  if (newLine) {
    easyPdf.offsetTo(0, getTextHeight(easyPdf)); // does not add paragraph spacing
  } else {
    easyPdf.moveTo(x + width, easyPdf.y); // end at the end of the text
  }
}

/**
 * Draws text with proper word spacing for both standard and custom fonts.
 *
 * This function handles the case where wordSpacing is specified and a custom font is used.
 * For custom fonts, it splits the text by words and renders each word separately with
 * the appropriate spacing.
 *
 * @param easyPdf - The internal PDF document context
 * @param text - The text to render
 * @param x - The x-coordinate (in points) where text rendering begins
 * @param y - The y-coordinate (in points) where text rendering begins
 * @param width - The total width (in points) allocated for the text
 * @param font - The PDF font to use for rendering
 * @param fontSize - The size of the font in points
 * @param color - The color used for text rendering
 * @param wordSpacing - Additional horizontal spacing between words (in points)
 * @param characterSpacing - Additional horizontal spacing between characters (in points)
 * @param stretchX - Horizontal scaling factor for the text
 * @param stretchY - Vertical scaling factor for the text
 * @param bold - Renders text in a bold style if true
 * @param italic - Renders text with an italic skew if true
 * @param underline - Adds an underline to the text if true
 * @param strikethrough - Adds a strikethrough line to the text if true
 */
export function drawTextWithWordSpacing(
  easyPdf: EasyPdfInternal,
  text: string,
  x: number,
  y: number,
  width: number,
  font: PDFFont,
  fontSize: number,
  color: Color,
  wordSpacing: number,
  characterSpacing: number,
  stretchX: number,
  stretchY: number,
  bold: boolean,
  italic: boolean,
  underline: boolean,
  strikethrough: boolean
): void {
  if (!text) return;

  // Check if we need to handle word spacing specially
  const embedder = (font as unknown as { embedder: FontEmbedder }).embedder;
  const isCustomFont = embedder instanceof CustomFontEmbedder;

  // If not a custom font or no word spacing or the text is a single word, use the standard method
  if (!isCustomFont || wordSpacing === 0 || text.indexOf(" ") === -1) {
    drawTextRaw(
      easyPdf,
      text,
      x,
      y,
      width,
      font,
      fontSize,
      color,
      wordSpacing,
      characterSpacing,
      stretchX,
      stretchY,
      bold,
      italic,
      underline,
      strikethrough
    );
    return;
  }

  // For custom fonts with word spacing, split by words and render each separately
  const words = text.split(" ");

  // Calculate the width of each word and render them with proper spacing
  let currentX = x;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Calculate the width of this word
    const kerningLength = calculateKernedTextWidth(word + " ", embedder);
    let wordWidth = (kerningLength.width / 1000) * fontSize;
    const wordCharacterSpacing = kerningLength.glyphCount * characterSpacing;
    wordWidth = (wordWidth + wordCharacterSpacing) * stretchX;

    // Draw the word
    drawTextRaw(
      easyPdf,
      word,
      currentX,
      y,
      wordWidth, // unused since underline and strikethrough are drawn separately
      font,
      fontSize,
      color,
      0,
      characterSpacing,
      stretchX,
      stretchY,
      bold,
      italic,
      false,
      false
    );

    // Move to the next word position
    currentX += wordWidth + wordSpacing * stretchX;
  }

  // If underline or strikethrough is needed, draw a single line for the entire text
  if (underline || strikethrough) {
    const operators: PDFOperator[] = [pushGraphicsState(), setFillingColor(color)];

    if (underline) {
      let { underlinePosition, underlineThickness } = getFontDimensions(font, fontSize);
      underlinePosition *= stretchY;
      underlineThickness *= stretchY;
      operators.push(rectangle(x, y - underlinePosition - underlineThickness / 2, width, underlineThickness), fill());
    }

    if (strikethrough) {
      // Position strikethrough at approximately the middle of lowercase letters
      let { ascent, underlineThickness } = getFontDimensions(font, fontSize);
      ascent *= stretchY;
      underlineThickness *= stretchY;
      operators.push(rectangle(x, y - ascent / 3 - underlineThickness / 2, width, underlineThickness), fill());
    }

    operators.push(popGraphicsState());
    easyPdf.pdfPage.pushOperators(...operators);
  }
}

/**
 * Renders text directly onto a PDF page with precise control over text rendering.
 *
 * This low-level function provides granular control over text appearance and
 * positioning, supporting advanced typography features such as:
 * - Precise font rendering
 * - Custom color and opacity
 * - Word and character spacing
 * - Text stretching and skewing
 * - Styling options (bold, italic, underline, strikethrough)
 *
 * @param {EasyPdfInternal} easyPdf - The internal PDF document context
 * @param {string} text - The text content to render
 * @param {number} x - The x-coordinate (in points) where text rendering begins
 * @param {number} y - The y-coordinate (in points) where text rendering begins
 * @param {number} width - The total width (in points) allocated for the text
 * @param {PDFFont} font - The PDF font to use for rendering
 * @param {number} fontSize - The size of the font in points
 * @param {Color} color - The color used for text rendering
 * @param {number} wordSpacing - Additional horizontal spacing between words (in points)
 * @param {number} characterSpacing - Additional horizontal spacing between characters (in points)
 * @param {number} stretchX - Horizontal scaling factor for the text
 * @param {number} stretchY - Vertical scaling factor for the text
 * @param {boolean} bold - Renders text in a bold style if true
 * @param {boolean} italic - Renders text with an italic skew if true
 * @param {boolean} underline - Adds an underline to the text if true
 * @param {boolean} strikethrough - Adds a strikethrough line to the text if true
 *
 * @throws {Error} If the text is empty or cannot be rendered
 *
 * @remarks
 * This function uses low-level PDF operators to achieve precise text rendering.
 * It supports complex text styling beyond standard font rendering.
 */
export function drawTextRaw(
  easyPdf: EasyPdfInternal,
  text: string,
  x: number,
  y: number,
  width: number,
  font: PDFFont,
  fontSize: number,
  color: Color,
  wordSpacing: number,
  characterSpacing: number,
  stretchX: number,
  stretchY: number,
  bold: boolean,
  italic: boolean,
  underline: boolean,
  strikethrough: boolean
): void {
  if (!text) return;

  // Compute italic skew
  const italicSkew = italic ? 0.21256 : 0;

  // Prepare operators
  const operators: PDFOperator[] = [
    // Save graphics state
    pushGraphicsState(),

    // Set character and word spacing
    setCharacterSpacing(characterSpacing),
    setWordSpacing(wordSpacing),

    // Begin text mode
    beginText(),

    // Set font and size
    setFontAndSize(getPdfNameOfFont(easyPdf, font), fontSize),

    // Set text color
    setFillingColor(color),

    // Set text matrix with italic skew and stretching
    setTextMatrix(stretchX, 0, italicSkew * stretchX, -stretchY, x, y),
  ];

  // Handle bold rendering
  if (bold) {
    operators.push(
      setTextRenderingMode(TextRenderingMode.FillAndOutline),
      setStrokingColor(color),
      setLineWidth(fontSize / 30),
      setLineCap(LineCapStyle.Projecting),
      setLineJoin(LineJoinStyle.Miter),
      setDashPattern([], 0)
    );
  }

  // Mark the font as used (sets font.modified to true)
  font.encodeText("");

  // Use the font embedder to show text with kerning
  operators.push(showTextAdjusted(text, easyPdf.pdfDocument, (font as unknown as { embedder: FontEmbedder }).embedder), endText());

  // Underline
  if (underline) {
    let { underlinePosition, underlineThickness } = getFontDimensions(font, fontSize);
    underlinePosition *= stretchY;
    underlineThickness *= stretchY;
    operators.push(rectangle(x, y - underlinePosition - underlineThickness / 2, width, underlineThickness), fill());
  }

  // Strikethrough
  if (strikethrough) {
    // Position strikethrough at approximately the middle of lowercase letters
    let { ascent, underlineThickness } = getFontDimensions(font, fontSize);
    ascent *= stretchY;
    underlineThickness *= stretchY;
    operators.push(rectangle(x, y - ascent / 3 - underlineThickness / 2, width, underlineThickness), fill());
  }

  // Restore graphics state
  operators.push(popGraphicsState());

  // Push all operators
  easyPdf.pdfPage.pushOperators(...operators);
}

/**
 * Retrieves the PDF name of a font, either from the existing font keys or by creating a new one.
 */
function getPdfNameOfFont(easyPdf: EasyPdfInternal, font: PDFFont): PDFName {
  for (const pdfFont of easyPdf.fontKeys) {
    if (pdfFont.font === font) {
      return pdfFont.key;
    }
  }
  const newKey = easyPdf.pdfPage.node.newFontDictionary(font.name, font.ref);
  easyPdf.fontKeys.push({ key: newKey, font });
  return newKey;
}
