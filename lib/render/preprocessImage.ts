import { BrightnessMap } from "./types";

type PreprocessOptions = {
  maxWidth?: number;
  maxHeight?: number;
};

export async function preprocessImage(file: File, options?: PreprocessOptions): Promise<BrightnessMap> {
  const imageBitmap = await createImageBitmap(file);
  const maxWidth = Math.max(1, options?.maxWidth ?? imageBitmap.width);
  const maxHeight = Math.max(1, options?.maxHeight ?? imageBitmap.height);
  const scale = Math.min(maxWidth / imageBitmap.width, maxHeight / imageBitmap.height, 1);
  const width = Math.max(1, Math.floor(imageBitmap.width * scale));
  const height = Math.max(1, Math.floor(imageBitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Could not initialize 2D canvas context.");
  }

  context.drawImage(imageBitmap, 0, 0, width, height);
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
