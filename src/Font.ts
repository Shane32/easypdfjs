import { StandardFonts } from "./StandardFonts";

/**
 * Represents a specific font family, size and style.
 */
export class Font {
  // set indirectly in the constructor
  private _familyName: string = "";
  private _embedded: boolean = false;

  private static readonly _builtInFonts: string[] = [
    StandardFonts.Times,
    StandardFonts.Helvetica,
    StandardFonts.Courier,
    StandardFonts.Symbol,
    StandardFonts.ZapfDingbats,
  ];

  /**
   * Gets or sets the family name of this font.
   */
  get familyName(): string {
    return this._familyName;
  }

  set familyName(value: string | StandardFonts) {
    const fontName = value as string;

    if (!fontName) {
      throw new Error("Font family name cannot be null or empty");
    }

    // Check if the font is a built-in font
    const builtInFont = Font._builtInFonts.find((x) => x.toLowerCase() === fontName.toLowerCase());

    if (builtInFont) {
      this._familyName = builtInFont;
      this._embedded = false;
    } else {
      this._familyName = fontName;
      this._embedded = true;
    }
  }

  /**
   * Indicates if this font is embedded or a built-in font.
   */
  get embedded(): boolean {
    return this._embedded;
  }

  /**
   * Gets or sets the em-size of the font measured in points.
   */
  size: number;

  /**
   * Indicates if the font has a bold style.
   */
  bold: boolean = false;

  /**
   * Indicates if the font has an italic style.
   */
  italic: boolean = false;

  /**
   * Indicates if the font has an underline style.
   */
  underline: boolean = false;

  /**
   * Indicates if the font has a strikeout style.
   */
  strikeout: boolean = false;

  /**
   * Indicates if word-wrapped text is justified.
   */
  justify: boolean = false;

  /**
   * The line spacing multiple to use.
   * Line height calculations take this value into account.
   */
  lineSpacing: number = 1.0;

  /**
   * The amount of indentation for word-wrapped lines measured in the document's
   * current ScaleMode setting.
   */
  hangingIndent: number = 0;

  /**
   * The additional amount of spacing after a carriage return (but not after
   * word-wrapped text) measured in points.
   */
  paragraphSpacing: number = 0;

  /**
   * A multiplier that stretches the text along the X axis.
   */
  stretchX: number = 1.0;

  /**
   * A multiplier that stretches the height of the text.
   */
  stretchY: number = 1.0;

  /**
   * The amount of space between characters measured in points.
   */
  characterSpacing: number = 0;

  /**
   * Initializes a new instance with the specified variables.
   * @param family The family name of this font.
   * @param size The font em-size of the font.
   * @param bold Indicates if the font is bold.
   * @param italic Indicates if the font is italic.
   * @param underline Indicates if the font is underlined.
   * @param strikeout Indicates if the font is strikeout.
   */
  constructor(
    familyName: string | StandardFonts,
    size: number,
    bold: boolean = false,
    italic: boolean = false,
    underline: boolean = false,
    strikeout: boolean = false
  ) {
    this.familyName = familyName;
    this.size = size;
    this.bold = bold;
    this.italic = italic;
    this.underline = underline;
    this.strikeout = strikeout;
  }
}
