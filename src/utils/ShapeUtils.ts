import { EasyPdfInternal } from "../EasyPdfInternal";

/**
 * Default bulge value for curved corners
 * Calculated as 4 * (sqrt(2) - 1) / 3
 */
const DefaultBulge = 0.5522847498307936;

/**
 * Draws an ellipse centered at the specified position with specified radiuses
 */
export function drawEllipse(easyPdf: EasyPdfInternal, radiusX: number, radiusY: number, border: boolean, fill: boolean): void {
  easyPdf.finishLine();
  if (!(border || fill)) return;

  // Approximate ellipse with Bezier curves
  const kappa = DefaultBulge;
  const x = easyPdf.position.x;
  const y = easyPdf.position.y;
  const ox = radiusX * kappa;
  const oy = radiusY * kappa;

  // Use path state to draw the ellipse
  easyPdf.moveTo(x - radiusX, y);
  easyPdf.bezierCurveTo({ x: x - radiusX, y: y - oy }, { x: x - ox, y: y - radiusY }, { x: x, y: y - radiusY });
  easyPdf.bezierCurveTo({ x: x + ox, y: y - radiusY }, { x: x + radiusX, y: y - oy }, { x: x + radiusX, y: y });
  easyPdf.bezierCurveTo({ x: x + radiusX, y: y + oy }, { x: x + ox, y: y + radiusY }, { x: x, y: y + radiusY });
  easyPdf.bezierCurveTo({ x: x - ox, y: y + radiusY }, { x: x - radiusX, y: y + oy }, { x: x - radiusX, y: y });
  easyPdf.finishPolygon(border, fill);
  easyPdf.moveTo(x, y); // Reset position to center of ellipse
}

/**
 * Options for drawing a rectangle
 */
export interface RectangleOptions {
  width: number;
  height: number;
  borderRadius?: number;
  fill?: boolean;
  border?: boolean;
  inset?: number;
}

/**
 * Draws a rectangle at the specified position with options
 */
export function drawRectangle(easyPdf: EasyPdfInternal, options: RectangleOptions): void {
  // Ensure there is no existing path
  easyPdf.finishLine();

  if (!(options.border || options.fill)) return;

  const { width, height, borderRadius = 0, fill = false, border = true, inset = 0 } = options;

  // If no border radius, use simple rectangle
  if (borderRadius === 0) {
    easyPdf.rectangleInternal(width, height);
    easyPdf.finishPolygon(border, fill);
  } else {
    // Rounded rectangle
    const x = easyPdf.position.x;
    const y = easyPdf.position.y;
    const r = borderRadius;
    const bulge = DefaultBulge;

    // Start at bottom-left rounded corner
    easyPdf.moveTo(x + r, y);

    // Top side with right bottom rounded corner
    easyPdf.lineTo(x + width - r, y);
    easyPdf.cornerTo(0, r, true, bulge, bulge);

    // Right side with top right rounded corner
    easyPdf.lineTo(x + width, y + height - r);
    easyPdf.cornerTo(-r, 0, true, bulge, bulge);

    // Bottom side with left bottom rounded corner
    easyPdf.lineTo(x + r, y + height);
    easyPdf.cornerTo(0, -r, true, bulge, bulge);

    // Left side with top left rounded corner
    easyPdf.lineTo(x, y + r);
    easyPdf.cornerTo(r, 0, true, bulge, bulge);

    // Close and fill/stroke
    easyPdf.finishPolygon(border, fill);

    easyPdf.moveTo(x, y); // Reset position to top-left corner
  }

  // Draw inner rectangle if inset is specified
  if (inset > 0) {
    const oldPosition = easyPdf.position;
    easyPdf.offsetTo(inset, inset);
    drawRectangle(easyPdf, {
      width: width - inset * 2,
      height: height - inset * 2,
      borderRadius: borderRadius,
      fill,
      border,
    });
    easyPdf.position = oldPosition;
  }
}

/**
 * Draws or continues a line as a curve from the current position to the specified offset coordinates
 * @param easyPdf - The EasyPdf instance to draw the curve
 * @param offsetX - The X offset coordinate
 * @param offsetY - The Y offset coordinate
 * @param fromSide - Controls if this is an inner or outer curve
 * @param bulgeHorizontal - Controls the amount of horizontal curvature
 * @param bulgeVertical - Controls the amount of vertical curvature
 * @returns The EasyPdf instance for method chaining
 */
export function cornerTo(
  easyPdf: EasyPdfInternal,
  offsetX: number,
  offsetY: number,
  fromSide: boolean = true,
  bulgeHorizontal: number = DefaultBulge,
  bulgeVertical: number = DefaultBulge
): EasyPdfInternal {
  const currentPos = easyPdf.position;
  const x2 = currentPos.x + offsetX;
  const y2 = currentPos.y + offsetY;

  if (fromSide) {
    easyPdf.quadraticCurveTo(
      {
        x: currentPos.x,
        y: (y2 - currentPos.y) * bulgeVertical + currentPos.y,
      },
      {
        x: x2 - (x2 - currentPos.x) * bulgeHorizontal,
        y: y2,
      }
    );
  } else {
    easyPdf.quadraticCurveTo(
      {
        x: (x2 - currentPos.x) * bulgeHorizontal + currentPos.x,
        y: currentPos.y,
      },
      {
        x: x2,
        y: y2 - (y2 - currentPos.y) * bulgeVertical,
      }
    );
  }

  return easyPdf;
}
