/**
 * Specifies a line cap style used when drawing lines.
 */
export enum LineCapStyle {
  /**
   * The line will end abruptly at the start/end coordinate, without extending past the coordinate.
   * A line that starts and ends at the same coordinate will be invisible.
   */
  Butt = 0,

  /**
   * The line will extend past the start/end coordinate with a half circle the radius of the line width.
   * A line that starts and ends at the same coordinate will appear to be a circle.
   */
  Round = 1,

  /**
   * The line will extend past the start/end coordinate by the amount of half the line width.
   * A line that starts and ends at the same coordinate will appear to be a square.
   */
  Square = 2,
}
