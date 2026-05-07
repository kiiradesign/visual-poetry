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

function antiBandingJitter(col: number, row: number, amplitude: number): number {
  const hash = (row * 92821 + col * 68917) % 997;
  const normalized = hash / 996;
  return (normalized * 2 - 1) * amplitude;
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
    settings.wordSpacing
  );
  const rowStep = Math.max(1, Math.floor(settings.cellSize * settings.lineHeight));
  const backgroundBrightness = estimateBackgroundBrightness(brightnessMap);
  context.fillStyle = settings.textColor;
  context.font = `400 ${settings.cellSize}px "IBM Plex Mono", monospace`;
  context.textBaseline = "top";
  context.textAlign = "left";

  const tonalSignals = new Float32Array(dimensions.cols * dimensions.rows);
  const localContrasts = new Float32Array(dimensions.cols * dimensions.rows);
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
      localContrasts[row * dimensions.cols + col] = contrast;
      const tonalSignal = Math.max(0, Math.min(1, (1 - brightness) * 0.8 + contrast * 1.4));
      tonalSignals[row * dimensions.cols + col] = tonalSignal;
      minSignal = Math.min(minSignal, tonalSignal);
      maxSignal = Math.max(maxSignal, tonalSignal);
    }
  }

  const signalRange = Math.max(0.0001, maxSignal - minSignal);
  const sliderStrength = Math.max(0, Math.min(1, settings.detailStrength));
  const jitterAmplitude = Math.min(0.9, settings.cellSize * 0.12);
  const coverageBalance = 0.7;
  const usingPretextLayout = true;
  let currentWeight = 400;

  function quantizedWeight(normalizedSignal: number): number {
    // Keep glyphs readable while still conveying detail through stroke density.
    // Quantized to available font files loaded in next/font.
    const minWeight = 300;
    const maxWeight = 700;
    const raw = minWeight + normalizedSignal * (maxWeight - minWeight);
    return Math.round(raw / 100) * 100;
  }

  for (let row = 0; row < dimensions.rows; row += 1) {
    for (let col = 0; col < dimensions.cols; col += 1) {
      const glyph = glyphs[row * dimensions.cols + col];
      if (glyph !== " ") {
        const localContrast = localContrasts[row * dimensions.cols + col];
        const signal = tonalSignals[row * dimensions.cols + col];
        const normalized = Math.max(0, Math.min(1, (signal - minSignal) / signalRange));
        const curved = Math.pow(normalized, 0.72);
        const contrastBoost = 1 + sliderStrength * (usingPretextLayout ? 3.1 : 4.8);
        let contrasted = Math.max(0, Math.min(1, (curved - 0.5) * contrastBoost + 0.5));

        // At high detail, push toward monochrome ASCII-style tonal bands.
        if (sliderStrength > 0.72) {
          const highDetail = (sliderStrength - 0.72) / 0.28;
          const levels = Math.max(2, Math.round(8 - highDetail * 5)); // 8->3 levels
          const quantized = Math.round(contrasted * levels) / levels;
          const dither = ((row * 17 + col * 31) % 97) / 97;
          const thresholded = quantized > dither ? 1 : quantized;
          const thresholdMix = usingPretextLayout ? highDetail * 0.18 : highDetail * 0.35;
          contrasted = quantized * (1 - thresholdMix) + thresholded * thresholdMix;
        }

        // 0.0 => near-uniform opacity, 1.0 => strong monochrome-like variation.
        // Never let glyphs disappear entirely; thinned + faint is preferred.
        const baseAlpha = usingPretextLayout ? 0.9 : 0.78;
        const minAlpha = usingPretextLayout ? 0.16 : 0.14;
        const maxAlpha = 1;
        const contrastedAlpha = minAlpha + (maxAlpha - minAlpha) * contrasted;
        let alpha = baseAlpha + (contrastedAlpha - baseAlpha) * sliderStrength;
        // Coverage-heavy mode keeps more glyphs visible; detail-heavy mode can fade
        // weak-contrast zones, but never to zero.
        if (usingPretextLayout) {
          const haloFade = Math.max(0, Math.min(1, (localContrast - 0.05) / 0.2));
          const fadeStrength = (1 - coverageBalance) * 0.12;
          alpha *= 1 - (1 - haloFade) * fadeStrength;
        }
        const targetWeight = quantizedWeight(normalized);
        if (targetWeight !== currentWeight) {
          currentWeight = targetWeight;
          context.font = `${currentWeight} ${settings.cellSize}px "IBM Plex Mono", monospace`;
        }
        context.globalAlpha = Math.max(minAlpha, Math.min(1, alpha));
        const jitterX = antiBandingJitter(col, row, jitterAmplitude);
        context.fillText(glyph, col * settings.cellSize + jitterX, row * rowStep);
      }
    }
  }
  context.globalAlpha = 1;
}
