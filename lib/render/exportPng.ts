import { renderToCanvas } from "./renderToCanvas";
import { BrightnessMap, RenderDimensions, RenderSettings } from "./types";

export type ExportViewport = {
  width: number;
  height: number;
  zoom: number;
};

export type ExportFormat = "png" | "jpg";

export function exportImage(
  poem: string,
  brightnessMap: BrightnessMap,
  dimensions: RenderDimensions,
  settings: RenderSettings,
  viewport: ExportViewport,
  outputScale: number,
  format: ExportFormat
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
  const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
  const quality = format === "jpg" ? 0.92 : undefined;

  link.download = `visual-poetry-${timestamp}.${format}`;
  link.href = canvas.toDataURL(mimeType, quality);
  link.click();
}
