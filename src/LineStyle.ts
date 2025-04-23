import { LineCapStyle } from "./LineCapStyle";
import { LineJoinStyle } from "./LineJoinStyle";
import { LineDashStyle } from "./LineDashStyle";

/**
 * The line style to use when drawing lines or borders.
 */
export class LineStyle {
  private _capStyle: LineCapStyle;
  private _joinStyle: LineJoinStyle;
  private _dashStyle: LineDashStyle;
  private _width: number;

  /**
   * Initializes a new instance with the specified parameters.
   * @param width The line width used when drawing lines or borders, specified in points.
   * @param capStyle The LineCapStyle used when drawing lines.
   * @param joinStyle The LineJoinStyle used when drawing lines or borders.
   * @param dashStyle The LineDashStyle used when drawing lines or borders. Defaults to LineDashStyle.Solid when null.
   */
  constructor(
    width: number = 0.1,
    capStyle: LineCapStyle = LineCapStyle.Butt,
    joinStyle: LineJoinStyle = LineJoinStyle.Miter,
    dashStyle: LineDashStyle | null = null
  ) {
    this._width = width;
    this._capStyle = capStyle;
    this._joinStyle = joinStyle;
    this._dashStyle = dashStyle ?? LineDashStyle.Solid;
  }

  /**
   * Gets or sets the current LineCapStyle used when drawing lines.
   */
  get capStyle(): LineCapStyle {
    return this._capStyle;
  }

  set capStyle(value: LineCapStyle) {
    switch (value) {
      case LineCapStyle.Butt:
      case LineCapStyle.Round:
      case LineCapStyle.Square:
        this._capStyle = value;
        break;
      default:
        throw new Error(`Invalid LineCapStyle value: ${value}`);
    }
  }

  /**
   * Gets or sets the current LineJoinStyle used when drawing lines or borders.
   */
  get joinStyle(): LineJoinStyle {
    return this._joinStyle;
  }

  set joinStyle(value: LineJoinStyle) {
    switch (value) {
      case LineJoinStyle.Bevel:
      case LineJoinStyle.Miter:
      case LineJoinStyle.Rounded:
        this._joinStyle = value;
        break;
      default:
        throw new Error(`Invalid LineJoinStyle value: ${value}`);
    }
  }

  /**
   * Gets or sets the current LineDashStyle used when drawing lines or borders.
   */
  get dashStyle(): LineDashStyle {
    return this._dashStyle;
  }

  set dashStyle(value: LineDashStyle) {
    if (value === null) {
      throw new Error("DashStyle cannot be null");
    }
    this._dashStyle = value;
  }

  /**
   * Gets or sets the current line width used when drawing lines or borders, specified in the scale of the document.
   * Defaults to 0.1 points.
   */
  get width(): number {
    return this._width;
  }

  set width(value: number) {
    if (value < 0) {
      throw new Error("Width cannot be negative");
    }
    this._width = value;
  }
}

/**
 * Clones the specified LineStyle object.
 * @param lineStyle The LineStyle object to clone.
 * @returns A new LineStyle object with the same properties as the original.
 */
export function cloneLineStyle(lineStyle: LineStyle): LineStyle {
  return new LineStyle(lineStyle.width, lineStyle.capStyle, lineStyle.joinStyle, lineStyle.dashStyle);
}
