import { renderToCanvas } from "./renderToCanvas";
import { BrightnessMap, RenderDimensions, RenderSettings } from "./types";

export type ExportViewport = {
  width: number;
  height: number;
  zoom: number;
};

export function exportPng(
  poem: string,
  brightnessMap: BrightnessMap,
  dimensions: RenderDimensions,
  settings: RenderSettings,
  viewport: ExportViewport,
  outputScale: number
): void {
  const canvas = document.createElement("canvas");

  renderToCanvas(canvas, poem, brightnessMap, dimensions, settings, {
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    zoom: viewport.zoom,
    outputScale,
  });

  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  link.download = `visual-poetry-${timestamp}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
