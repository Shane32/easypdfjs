/**
 * Represents a kerning pair with adjustment information.
 *
 * This interface defines the structure for kerning information between character pairs.
 * The adjustment value is in 1000ths of a unit of x adjustment to apply before writing the character.
 */
export interface KerningPair {
  /**
   * The Unicode code point of the character or an array of code points.
   * When an array is provided, it represents a sequence of characters that should be treated as a single unit.
   */
  code: number | number[];

  /**
   * The kerning adjustment to apply in 1000ths of a unit.
   * This represents the x-adjustment to apply before writing the character.
   * For the first character in a sequence, this would typically be zero.
   */
  adjustment: number;
}
