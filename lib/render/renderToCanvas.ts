import { layoutTextGrid, sampleBrightnessAtCell } from "./layoutTextGrid";
import { BrightnessMap, RenderDimensions, RenderSettings } from "./types";

function estimateBackgroundBrightness(brightnessMap: BrightnessMap): number {
  const { width, height, values } = brightnessMap;
  const corners = [
    values[0],
    values[Math.max(0, width - 1)],
    values[Math.max(0, (height - 1) * width)],
    values[Math.max(0, height * width - 1)],
  ];
  return corners.reduce((sum, value) => sum + value, 0) / corners.length;
}

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

  const glyphs = layoutTextGrid(
    poem,
    brightnessMap,
    dimensions.cols,
    dimensions.rows,
    settings.cellSize,
    settings.wordSpacing,
    settings.detailStrength
  );
  const rowStep = Math.max(1, Math.floor(settings.cellSize * settings.lineHeight));
  const backgroundBrightness = estimateBackgroundBrightness(brightnessMap);
  context.fillStyle = settings.textColor;
  context.font = `400 ${settings.cellSize}px "IBM Plex Mono", monospace`;
  context.textBaseline = "top";
  context.textAlign = "left";

  const tonalSignals = new Float32Array(dimensions.cols * dimensions.rows);
  let minSignal = Number.POSITIVE_INFINITY;
  let maxSignal = Number.NEGATIVE_INFINITY;

  for (let row = 0; row < dimensions.rows; row += 1) {
    for (let col = 0; col < dimensions.cols; col += 1) {
      const glyph = glyphs[row * dimensions.cols + col];
      if (glyph === " ") {
        continue;
      }
      const brightness = sampleBrightnessAtCell(
        brightnessMap,
        col,
        row,
        dimensions.cols,
        dimensions.rows
      );
      const contrast = Math.abs(brightness - backgroundBrightness);
      const tonalSignal = Math.max(0, Math.min(1, (1 - brightness) * 0.8 + contrast * 1.4));
      tonalSignals[row * dimensions.cols + col] = tonalSignal;
      minSignal = Math.min(minSignal, tonalSignal);
      maxSignal = Math.max(maxSignal, tonalSignal);
    }
  }

  const signalRange = Math.max(0.0001, maxSignal - minSignal);
  const sliderStrength = Math.max(0, Math.min(1, settings.detailStrength));

  for (let row = 0; row < dimensions.rows; row += 1) {
    for (let col = 0; col < dimensions.cols; col += 1) {
      const glyph = glyphs[row * dimensions.cols + col];
      if (glyph !== " ") {
        const signal = tonalSignals[row * dimensions.cols + col];
        const normalized = Math.max(0, Math.min(1, (signal - minSignal) / signalRange));
        const curved = Math.pow(normalized, 0.72);
        const contrastBoost = 1 + sliderStrength * 4.8;
        let contrasted = Math.max(0, Math.min(1, (curved - 0.5) * contrastBoost + 0.5));

        // At high detail, push toward monochrome ASCII-style tonal bands.
        if (sliderStrength > 0.72) {
          const highDetail = (sliderStrength - 0.72) / 0.28;
          const levels = Math.max(2, Math.round(8 - highDetail * 5)); // 8->3 levels
          const quantized = Math.round(contrasted * levels) / levels;
          const dither = ((row * 17 + col * 31) % 97) / 97;
          const thresholded = quantized > dither ? 1 : quantized;
          contrasted = quantized * (1 - highDetail * 0.35) + thresholded * (highDetail * 0.35);
        }

        // 0.0 => near-uniform opacity, 1.0 => strong monochrome-like variation.
        const baseAlpha = 0.78;
        const minAlpha = 0.02;
        const maxAlpha = 1;
        const contrastedAlpha = minAlpha + (maxAlpha - minAlpha) * contrasted;
        const alpha = baseAlpha + (contrastedAlpha - baseAlpha) * sliderStrength;
        context.globalAlpha = Math.max(0.02, Math.min(1, alpha));
        context.fillText(glyph, col * settings.cellSize, row * rowStep);
      }
    }
  }
  context.globalAlpha = 1;
}
