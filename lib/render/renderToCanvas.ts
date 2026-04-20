import { layoutTextGrid } from "./layoutTextGrid";
import { BrightnessMap, RenderDimensions, RenderSettings } from "./types";

export function renderToCanvas(
  canvas: HTMLCanvasElement,
  poem: string,
  brightnessMap: BrightnessMap,
  dimensions: RenderDimensions,
  settings: RenderSettings
): void {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not initialize 2D canvas context.");
  }

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  context.fillStyle = settings.backgroundColor;
  context.fillRect(0, 0, dimensions.width, dimensions.height);

  const glyphs = layoutTextGrid(poem, brightnessMap, dimensions.cols, dimensions.rows);
  context.fillStyle = settings.textColor;
  context.font = `${settings.cellSize}px var(--font-render), monospace`;
  context.textBaseline = "top";
  context.textAlign = "left";

  for (let row = 0; row < dimensions.rows; row += 1) {
    for (let col = 0; col < dimensions.cols; col += 1) {
      const glyph = glyphs[row * dimensions.cols + col];
      if (glyph !== " ") {
        context.fillText(glyph, col * settings.cellSize, row * settings.cellSize);
      }
    }
  }
}
