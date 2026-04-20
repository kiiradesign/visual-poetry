import { BrightnessMap } from "./types";

export async function preprocessImage(file: File): Promise<BrightnessMap> {
  const imageBitmap = await createImageBitmap(file);
  const width = imageBitmap.width;
  const height = imageBitmap.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Could not initialize 2D canvas context.");
  }

  context.drawImage(imageBitmap, 0, 0);
  const imageData = context.getImageData(0, 0, width, height);
  const brightness = new Float32Array(width * height);

  for (let pixelIndex = 0; pixelIndex < imageData.data.length; pixelIndex += 4) {
    const red = imageData.data[pixelIndex];
    const green = imageData.data[pixelIndex + 1];
    const blue = imageData.data[pixelIndex + 2];
    const alpha = imageData.data[pixelIndex + 3] / 255;
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    brightness[pixelIndex / 4] = luminance * alpha + (1 - alpha);
  }

  imageBitmap.close();
  return {
    width,
    height,
    values: brightness,
  };
}
