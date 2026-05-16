import { renderToCanvas } from "./renderToCanvas";
import { BrightnessMap, RenderDimensions, RenderSettings } from "./types";

export type ExportViewport = {
  width: number;
  height: number;
  zoom: number;
};

export type ExportFormat = "png" | "jpg" | "gif";

/** Fit exports to a square canvas using the smaller preview dimension. */
export function toSquareExportViewport(viewport: ExportViewport): ExportViewport {
  const size = Math.min(viewport.width, viewport.height);
  return { width: size, height: size, zoom: viewport.zoom };
}

export function exportImage(
  poem: string,
  brightnessMap: BrightnessMap,
  dimensions: RenderDimensions,
  settings: RenderSettings,
  viewport: ExportViewport,
  outputScale: number,
  format: ExportFormat
): void {
  const squareViewport = toSquareExportViewport(viewport);
  const canvas = document.createElement("canvas");

  renderToCanvas(canvas, poem, brightnessMap, dimensions, settings, {
    viewportWidth: squareViewport.width,
    viewportHeight: squareViewport.height,
    zoom: squareViewport.zoom,
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
