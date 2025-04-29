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
  // First move to the leftmost point of the ellipse
  easyPdf.offsetTo(-radiusX, 0);

  // Now use relative coordinates for the bezier curves
  // Bottom-right quadrant (current position -radiusX, 0)
  easyPdf.bezierCurveTo({ x: 0, y: -oy }, { x: radiusX - ox, y: -radiusY }, { x: radiusX, y: -radiusY });

  // Bottom-left quadrant (current position 0, -radiusY)
  easyPdf.bezierCurveTo({ x: ox, y: 0 }, { x: radiusX, y: radiusY - oy }, { x: radiusX, y: radiusY });

  // Top-left quadrant (current position radiusX, 0)
  easyPdf.bezierCurveTo({ x: 0, y: oy }, { x: -radiusX + ox, y: radiusY }, { x: -radiusX, y: radiusY });

  // Top-right quadrant (current position 0, radiusY)
  easyPdf.bezierCurveTo({ x: -ox, y: 0 }, { x: -radiusX, y: -radiusY + oy }, { x: -radiusX, y: -radiusY }); // Ending position (current position -radiusX, 0)

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

  const { width, height, borderRadius: borderRadius = 0, fill = false, border = true, inset = 0 } = options;
  if (!(border || fill)) return;

  // If no border radius, use simple rectangle
  if (borderRadius === 0) {
    easyPdf.rectangleInternal(width, height);
    easyPdf.finishPolygon(border, fill);
  } else {
    // Rounded rectangle
    const pos = easyPdf.position;

    // Start at top-left corner, offset by the border radius to the right
    // This positions us at the start of the top edge
    easyPdf.offsetTo(borderRadius, 0);

    // Draw top edge (moving right) and top-right corner
    // After lineTo, we're at the point where the top-right corner starts
    easyPdf.lineTo(width - 2 * borderRadius, 0);
    // Draw the top-right corner (curve starting horizontally, then down)
    // After cornerTo, we're at the top of the right edge
    easyPdf.cornerTo(borderRadius, borderRadius, false);

    // Draw right edge (moving down) and bottom-right corner
    // After lineTo, we're at the point where the bottom-right corner starts
    easyPdf.lineTo(0, height - 2 * borderRadius);
    // Draw the bottom-right corner (curve starting vertically, then to the left)
    // After cornerTo, we're at the right end of the bottom edge
    easyPdf.cornerTo(-borderRadius, borderRadius, true);

    // Draw bottom edge (moving left) and bottom-left corner
    // After lineTo, we're at the point where the bottom-left corner starts
    easyPdf.lineTo(-(width - 2 * borderRadius), 0);
    // Draw the bottom-left corner (curve starting horizontally, then up)
    // After cornerTo, we're at the bottom of the left edge
    easyPdf.cornerTo(-borderRadius, -borderRadius, false);

    // Draw left edge (moving up) and top-left corner
    // After lineTo, we're at the point where the top-left corner starts
    easyPdf.lineTo(0, -(height - 2 * borderRadius));
    // Draw the top-left corner (curve starting vertically, then to the right)
    // After cornerTo, we're back at the starting point
    easyPdf.cornerTo(borderRadius, -borderRadius, true);

    // Close and fill/stroke
    easyPdf.finishPolygon(border, fill);

    easyPdf.moveTo(pos); // Reset position to original position
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
 * Draws a curved corner from the current position to a point offset by the specified coordinates
 * @param easyPdf - The EasyPdf instance to draw the curve
 * @param offsetX - The X offset from current position to the end point
 * @param offsetY - The Y offset from current position to the end point
 * @param fromSide - When false, the curve starts with horizontal tangent (moving along X-axis first).
 *                   When true, the curve starts with vertical tangent (moving along Y-axis first).
 * @param bulgeHorizontal - Controls the amount of horizontal curvature (0-1, default is 0.55)
 * @param bulgeVertical - Controls the amount of vertical curvature (0-1, default is 0.55)
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
  if (fromSide) {
    easyPdf.bezierCurveTo(
      {
        x: 0,
        y: offsetY * bulgeVertical,
      },
      {
        x: offsetX * (1 - bulgeHorizontal),
        y: offsetY,
      },
      {
        x: offsetX,
        y: offsetY,
      }
    );
  } else {
    easyPdf.bezierCurveTo(
      {
        x: offsetX * bulgeHorizontal,
        y: 0,
      },
      {
        x: offsetX,
        y: offsetY * (1 - bulgeVertical),
      },
      {
        x: offsetX,
        y: offsetY,
      }
    );
  }

  return easyPdf;
}
