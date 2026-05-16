import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { GIF_EXPORT_FPS, RENDER_ANIMATION_MS } from "./animation";
import { toSquareExportViewport, type ExportViewport } from "./exportPng";
import { buildRenderGlyphs, paintGlyphsToCanvas } from "./renderToCanvas";
import { BrightnessMap, RenderDimensions, RenderSettings } from "./types";

function visibleGlyphCountAtTime(glyphCount: number, elapsedMs: number): number {
  if (glyphCount <= 0) {
    return 0;
  }
  const glyphIntervalMs = RENDER_ANIMATION_MS / glyphCount;
  return Math.min(glyphCount, Math.max(0, Math.round(elapsedMs / glyphIntervalMs)));
}

function downloadGif(bytes: Uint8Array): void {
  const blob = new Blob([bytes], { type: "image/gif" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  link.download = `visual-poetry-${timestamp}.gif`;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportGif(
  poem: string,
  brightnessMap: BrightnessMap,
  dimensions: RenderDimensions,
  settings: RenderSettings,
  viewport: ExportViewport,
  outputScale: number
): Promise<void> {
  const glyphs = buildRenderGlyphs(
    poem,
    brightnessMap,
    dimensions,
    settings.cellSize,
    settings.lineHeight
  );

  if (glyphs.length === 0) {
    return;
  }

  const squareViewport = toSquareExportViewport(viewport);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Could not initialize 2D canvas context.");
  }

  const frameDelayMs = 1000 / GIF_EXPORT_FPS;
  const frameCount = Math.max(1, Math.round((RENDER_ANIMATION_MS / 1000) * GIF_EXPORT_FPS));
  const paintOptions = {
    viewportWidth: squareViewport.width,
    viewportHeight: squareViewport.height,
    zoom: squareViewport.zoom,
    outputScale,
  };

  const gif = GIFEncoder();

  for (let frame = 0; frame < frameCount; frame += 1) {
    const elapsedMs =
      frame === frameCount - 1
        ? RENDER_ANIMATION_MS
        : Math.min(RENDER_ANIMATION_MS, frame * frameDelayMs);

    paintGlyphsToCanvas(canvas, glyphs, dimensions, settings, {
      ...paintOptions,
      visibleGlyphCount: visibleGlyphCountAtTime(glyphs.length, elapsedMs),
    });

    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);

    gif.writeFrame(index, width, height, {
      palette,
      delay: frameDelayMs,
    });
  }

  gif.finish();
  downloadGif(gif.bytes());
}
