/**
 * Parses coordinate input into a standardized format
 *
 * @param xOrCoords - Either the x coordinate or an object with x and y coordinates
 * @param y - The y coordinate (required if first parameter is a number)
 * @returns The parsed coordinates
 * @throws {Error} If coordinates are invalid or y is missing when needed
 */
export function parseCoordinates(xOrCoords: number | { x: number; y: number }, y?: number): { x: number; y: number } {
  let x: number;
  let yCoord: number;

  if (typeof xOrCoords === "object") {
    x = xOrCoords.x;
    yCoord = xOrCoords.y;
  } else {
    x = xOrCoords;
    if (y === undefined) {
      throw new Error("Y coordinate must be provided when using separate x and y arguments");
    }
    yCoord = y;
  }

  if (!Number.isFinite(x) || !Number.isFinite(yCoord)) {
    throw new Error("Coordinates must be finite numbers");
  }

  return { x, y: yCoord };
}
