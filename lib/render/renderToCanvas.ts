import { layoutTextGrid, sampleBrightnessAtCell } from "./layoutTextGrid";
import { BrightnessMap, DETAIL_STRENGTH, RenderDimensions, RenderSettings } from "./types";

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

export type RenderOptions = {
  /** Logical viewport size (preview panel size in CSS pixels). */
  viewportWidth: number;
  viewportHeight: number;
  /** User-controlled subject zoom multiplier on top of the fit-to-viewport scale. */
  zoom: number;
  /** Output pixel multiplier for high-DPI export (1x / 2x / 4x). */
  outputScale: number;
};

export function renderToCanvas(
  canvas: HTMLCanvasElement,
  poem: string,
  brightnessMap: BrightnessMap,
  dimensions: RenderDimensions,
  settings: RenderSettings,
  options: RenderOptions
): void {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not initialize 2D canvas context.");
  }

  const canvasWidth = Math.max(1, Math.round(options.viewportWidth * options.outputScale));
  const canvasHeight = Math.max(1, Math.round(options.viewportHeight * options.outputScale));

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  context.fillStyle = settings.backgroundColor;
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  const glyphs = layoutTextGrid(
    poem,
    brightnessMap,
    dimensions.cols,
    dimensions.rows,
    settings.cellSize
  );
  const rowStep = Math.max(1, Math.floor(settings.cellSize * settings.lineHeight));
  const backgroundBrightness = estimateBackgroundBrightness(brightnessMap);

  // Compute the fit-scale that maps natural render dimensions into the viewport,
  // then multiply by zoom and output scale. Subject is centered in the canvas.
  const fitScale = Math.min(
    options.viewportWidth / dimensions.width,
    options.viewportHeight / dimensions.height
  );
  const finalScale = fitScale * options.zoom * options.outputScale;
  const renderedWidth = dimensions.width * finalScale;
  const renderedHeight = dimensions.height * finalScale;
  const offsetX = (canvasWidth - renderedWidth) / 2;
  const offsetY = (canvasHeight - renderedHeight) / 2;
  const scaledFontSize = Math.max(1, settings.cellSize * finalScale);

  context.fillStyle = settings.textColor;
  context.font = `400 ${scaledFontSize}px "IBM Plex Mono", monospace`;
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
  const sliderStrength = DETAIL_STRENGTH;
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
        const contrasted = Math.max(0, Math.min(1, (curved - 0.5) * contrastBoost + 0.5));

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
          context.font = `${currentWeight} ${scaledFontSize}px "IBM Plex Mono", monospace`;
        }
        context.globalAlpha = Math.max(minAlpha, Math.min(1, alpha));
        const jitterX = antiBandingJitter(col, row, jitterAmplitude);
        const drawX = offsetX + (col * settings.cellSize + jitterX) * finalScale;
        const drawY = offsetY + row * rowStep * finalScale;
        context.fillText(glyph, drawX, drawY);
      }
    }
  }
  context.globalAlpha = 1;
}
