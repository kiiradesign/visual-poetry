import { renderToCanvas } from "./renderToCanvas";
import { BrightnessMap, RenderDimensions, RenderSettings } from "./types";

export function exportPng(
  poem: string,
  brightnessMap: BrightnessMap,
  dimensions: RenderDimensions,
  settings: RenderSettings,
  scaleMultiplier: number
): void {
  const canvas = document.createElement("canvas");
  const scaledDimensions = {
    ...dimensions,
    width: dimensions.width * scaleMultiplier,
    height: dimensions.height * scaleMultiplier,
    cols: dimensions.cols,
    rows: dimensions.rows,
  };
  const scaledSettings = {
    ...settings,
    cellSize: settings.cellSize * scaleMultiplier,
  };

  renderToCanvas(canvas, poem, brightnessMap, scaledDimensions, scaledSettings);

  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  link.download = `visual-poetry-${timestamp}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
