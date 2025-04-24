/**
 * Specifies a text alignment when printing text.
 * Alignment is applied on a per-line basis; blocks of text cannot be aligned as a group.
 * @enum {number}
 */
export enum TextAlignment {
  /**
   * Text is aligned to the left and the top of the bounding box.
   */
  LeftTop,

  /**
   * Text is aligned to the left and centered vertically along the height of the capital letters.
   */
  LeftCenter,

  /**
   * Text is aligned to the left and aligned to the baseline of the text.
   */
  LeftBaseline,

  /**
   * Text is aligned to the left and aligned to the bottom of the bounding box, including any line spacing.
   */
  LeftBottom,

  /**
   * Text is horizontally centered and aligned to the top of the bounding box.
   */
  CenterTop,

  /**
   * Text is horizontally centered and centered vertically along the height of the capital letters.
   */
  CenterCenter,

  /**
   * Text is horizontally centered and aligned to the baseline of the text.
   */
  CenterBaseline,

  /**
   * Text is horizontally centered and aligned to the bottom of the bounding box, including any line spacing.
   */
  CenterBottom,

  /**
   * Text is aligned to the right and aligned to the top of the bounding box.
   */
  RightTop,

  /**
   * Text is aligned to the right and centered vertically along the height of the capital letters.
   */
  RightCenter,

  /**
   * Text is aligned to the right and aligned to the baseline of the text.
   */
  RightBaseline,

  /**
   * Text is aligned to the right and aligned to the bottom of the bounding box, including any line spacing.
   */
  RightBottom,
}
