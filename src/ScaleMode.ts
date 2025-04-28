/**
 * Represents the scale mode for measurements in the PDF document.
 * Provides flexibility in specifying dimensions using different units.
 */
export enum ScaleMode {
  /** Hundredths of an inch (1/100 inch) */
  Hundredths,
  /** Standard inches */
  Inches,
  /** PDF points (1/72 of an inch) */
  Points,
  /** Centimeters */
  Centimeters,
  /** Millimeters */
  Millimeters,
}
