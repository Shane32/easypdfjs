import { concatTransformationMatrix, drawObject, PDFImage, popGraphicsState, pushGraphicsState } from "pdf-lib";
import { EasyPdfInternal } from "../EasyPdfInternal";
import { PictureAlignment } from "../PictureAlignment";

export function paintPicture(easyPdf: EasyPdfInternal, image: PDFImage, options?: { dpi?: number; width?: number; height?: number }): void {
  // Validate DPI
  if (options?.dpi !== undefined && !Number.isFinite(options.dpi)) {
    throw new Error("options.dpi must be a finite number.");
  }

  // Validate and convert width and height to points if provided
  const pointWidth = options?.width !== undefined ? easyPdf.toPoints(options.width, "options.width") : undefined;
  const pointHeight = options?.height !== undefined ? easyPdf.toPoints(options.height, "options.height") : undefined;

  // Calculate original image dimensions at specified DPI converted to points
  const dpi = options?.dpi ?? 96; // Default to 96 DPI if not provided
  const originalWidth = (image.width / dpi) * 72;
  const originalHeight = (image.height / dpi) * 72;

  // Calculate image dimensions with proportional scaling
  let imageWidth: number, imageHeight: number;
  if (pointWidth !== undefined && pointHeight === undefined) {
    // Only width specified, scale height proportionally
    imageWidth = pointWidth;
    const aspectRatio = originalHeight / originalWidth;
    imageHeight = imageWidth * aspectRatio;
  } else if (pointHeight !== undefined && pointWidth === undefined) {
    // Only height specified, scale width proportionally
    imageHeight = pointHeight;
    const aspectRatio = originalWidth / originalHeight;
    imageWidth = imageHeight * aspectRatio;
  } else if (pointWidth !== undefined && pointHeight !== undefined) {
    // Both width and height specified, stretch to those dimensions
    imageWidth = pointWidth;
    imageHeight = pointHeight;
  } else {
    // Neither width nor height specified, use original dimensions
    imageWidth = originalWidth;
    imageHeight = originalHeight;
  }

  // Calculate positioning based on alignment
  let x = easyPdf.positionInternal.x;
  let y = easyPdf.positionInternal.y;

  switch (easyPdf.pictureAlignment) {
    case PictureAlignment.LeftTop:
      // No adjustment needed, already at top-left
      break;
    case PictureAlignment.LeftCenter:
      y -= imageHeight / 2;
      break;
    case PictureAlignment.LeftBottom:
      y -= imageHeight;
      break;
    case PictureAlignment.CenterTop:
      x -= imageWidth / 2;
      break;
    case PictureAlignment.CenterCenter:
      x -= imageWidth / 2;
      y -= imageHeight / 2;
      break;
    case PictureAlignment.CenterBottom:
      x -= imageWidth / 2;
      y -= imageHeight;
      break;
    case PictureAlignment.RightTop:
      x -= imageWidth;
      break;
    case PictureAlignment.RightCenter:
      x -= imageWidth;
      y -= imageHeight / 2;
      break;
    case PictureAlignment.RightBottom:
      x -= imageWidth;
      y -= imageHeight;
      break;
  }

  // Flip the image along the Y-axis for top-left coordinate system
  y += imageHeight;
  imageHeight = -imageHeight;

  // Draw the image
  easyPdf.pdfPage.pushOperators(
    pushGraphicsState(),
    concatTransformationMatrix(imageWidth, 0, 0, imageHeight, x, y),
    drawObject(easyPdf.pdfPage.node.newXObject("Image", image.ref)),
    popGraphicsState()
  );
}
