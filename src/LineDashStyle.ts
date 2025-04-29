/**
 * Represents a line dash pattern, such as a solid line, dashed or dotted pattern.
 */
export class LineDashStyle {
  private readonly _array: number[];

  /**
   * Returns the phase distance as measured in multiples of the line width.
   */
  readonly phase: number;

  /**
   * Creates a custom on-off pattern.
   * @param unitsOn As measured in multiples of the line width, the on distance of the pattern.
   * @param unitsOff As measured in multiples of the line width, the off distance of the pattern.
   * @param phase As measured in multiples of the line width, the distance through the pattern when starting a line.
   */
  constructor(unitsOn: number, unitsOff: number, phase: number);

  /**
   * Creates a custom on-off pattern.
   * @param array As measured in multiples of the line width, a list of alternating on/off distances of the pattern, beginning with an 'on' distance.
   * @param phase As measured in multiples of the line width, the distance through the pattern when starting a line.
   */
  constructor(array: number[], phase: number);

  constructor(arrayOrUnitsOn: number | number[], unitsOffOrPhase: number, phase?: number) {
    if (Array.isArray(arrayOrUnitsOn)) {
      this._array = [...arrayOrUnitsOn]; // Create a copy of the array
      this.phase = unitsOffOrPhase;
    } else if (phase !== undefined) {
      // unitsOn, unitsOff, phase
      this._array = [arrayOrUnitsOn, unitsOffOrPhase];
      this.phase = phase;
    } else {
      throw new Error("Invalid parameters for LineDashStyle constructor");
    }
  }

  /**
   * Returns a copy of the distance array, measured in multiples of the line width.
   */
  get array(): number[] {
    return [...this._array]; // Return a copy of the array
  }

  /**
   * Returns a copy of the array multiplied by the specified value.
   */
  multipliedArray(multiplier: number): number[] {
    return this._array.map((value) => value * multiplier);
  }

  /**
   * Returns the phase multiplied by the specified value.
   */
  multipliedPhase(multiplier: number): number {
    return this.phase * multiplier;
  }

  /**
   * Represents a solid line.
   */
  static readonly Solid = new LineDashStyle([], 0);

  /**
   * Represents a dashed line.
   */
  static readonly Dash = new LineDashStyle(6, 6, 3);

  /**
   * Represents a dotted line.
   */
  static readonly Dot = new LineDashStyle(2, 3, 0);

  /**
   * Represents a dash-dot-dot line pattern.
   */
  static readonly DashDotDot = new LineDashStyle([6, 3, 2, 3, 2, 3], 0);
}
