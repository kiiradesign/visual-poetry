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

export type RenderGlyph = {
  glyph: string;
  x: number;
  y: number;
  alpha: number;
  weight: number;
};

type PaintGlyphOptions = RenderOptions & {
  visibleGlyphCount?: number;
};

function getRenderGeometry(
  dimensions: RenderDimensions,
  cellSize: number,
  viewportWidth: number,
  viewportHeight: number,
  zoom: number
) {
  const fitScale = Math.min(viewportWidth / dimensions.width, viewportHeight / dimensions.height);
  const finalScale = fitScale * zoom;
  const renderedWidth = dimensions.width * finalScale;
  const renderedHeight = dimensions.height * finalScale;
  const offsetX = (viewportWidth - renderedWidth) / 2;
  const offsetY = (viewportHeight - renderedHeight) / 2;
  const scaledFontSize = Math.max(1, cellSize * finalScale);

  return { finalScale, offsetX, offsetY, scaledFontSize };
}

export function buildRenderGlyphs(
  poem: string,
  brightnessMap: BrightnessMap,
  dimensions: RenderDimensions,
  cellSize: number,
  lineHeight: number
): RenderGlyph[] {
  const glyphs = layoutTextGrid(poem, brightnessMap, dimensions.cols, dimensions.rows, cellSize);
  const rowStep = Math.max(1, Math.floor(cellSize * lineHeight));
  const backgroundBrightness = estimateBackgroundBrightness(brightnessMap);
  const points: Array<{ glyph: string; x: number; y: number; col: number; row: number; order: number }> = [];
  const jitterAmplitude = Math.min(0.9, cellSize * 0.12);

  for (let row = 0; row < dimensions.rows; row += 1) {
    for (let col = 0; col < dimensions.cols; col += 1) {
      const glyph = glyphs[row * dimensions.cols + col];
      if (glyph === " ") {
        continue;
      }

      const jitterX = antiBandingJitter(col, row, jitterAmplitude);
      points.push({
        glyph,
        x: col * cellSize + jitterX,
        y: row * rowStep,
        col,
        row,
        order: row * dimensions.cols + col,
      });
    }
  }

  const tonalSignals = new Float32Array(points.length);
  let minSignal = Number.POSITIVE_INFINITY;
  let maxSignal = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const brightness = sampleBrightnessAtCell(
      brightnessMap,
      point.col,
      point.row,
      dimensions.cols,
      dimensions.rows
    );
    const contrast = Math.abs(brightness - backgroundBrightness);
    const tonalSignal = Math.max(0, Math.min(1, (1 - brightness) * 0.8 + contrast * 1.4));
    tonalSignals[i] = tonalSignal;
    minSignal = Math.min(minSignal, tonalSignal);
    maxSignal = Math.max(maxSignal, tonalSignal);
  }

  const signalRange = Math.max(0.0001, maxSignal - minSignal);
  const minAlpha = 0.16;
  const baseAlpha = 0.9;
  const maxAlpha = 1;
  const sliderStrength = DETAIL_STRENGTH;

  return points.map((point, index) => {
    const normalized = Math.max(0, Math.min(1, (tonalSignals[index] - minSignal) / signalRange));
    const curved = Math.pow(normalized, 0.72);
    const contrastBoost = 1 + sliderStrength * 3.1;
    const contrasted = Math.max(0, Math.min(1, (curved - 0.5) * contrastBoost + 0.5));
    const contrastedAlpha = minAlpha + (maxAlpha - minAlpha) * contrasted;
    const alpha = Math.max(minAlpha, Math.min(1, baseAlpha + (contrastedAlpha - baseAlpha) * sliderStrength));
    const weight = Math.round((300 + normalized * 400) / 100) * 100;

    return {
      glyph: point.glyph,
      x: point.x,
      y: point.y,
      alpha,
      weight,
    };
  });
}

export function paintGlyphsToCanvas(
  canvas: HTMLCanvasElement,
  glyphs: RenderGlyph[],
  dimensions: RenderDimensions,
  settings: RenderSettings,
  options: PaintGlyphOptions
): void {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not initialize 2D canvas context.");
  }

  const outputScale = Math.max(1, options.outputScale);
  const canvasWidth = Math.max(1, Math.round(options.viewportWidth * outputScale));
  const canvasHeight = Math.max(1, Math.round(options.viewportHeight * outputScale));
  const visibleGlyphCount = Math.max(
    0,
    Math.min(glyphs.length, Math.floor(options.visibleGlyphCount ?? glyphs.length))
  );

  if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  }

  const cssWidth = `${options.viewportWidth}px`;
  const cssHeight = `${options.viewportHeight}px`;
  if (canvas.style.width !== cssWidth) {
    canvas.style.width = cssWidth;
  }
  if (canvas.style.height !== cssHeight) {
    canvas.style.height = cssHeight;
  }

  context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
  context.clearRect(0, 0, options.viewportWidth, options.viewportHeight);
  context.fillStyle = settings.backgroundColor;
  context.fillRect(0, 0, options.viewportWidth, options.viewportHeight);

  const { finalScale, offsetX, offsetY, scaledFontSize } = getRenderGeometry(
    dimensions,
    settings.cellSize,
    options.viewportWidth,
    options.viewportHeight,
    options.zoom
  );

  context.fillStyle = settings.textColor;
  context.textBaseline = "top";
  context.textAlign = "left";

  let currentWeight = 400;
  context.font = `${currentWeight} ${scaledFontSize}px "IBM Plex Mono", monospace`;

  for (let index = 0; index < visibleGlyphCount; index += 1) {
    const glyph = glyphs[index];
    if (glyph.weight !== currentWeight) {
      currentWeight = glyph.weight;
      context.font = `${currentWeight} ${scaledFontSize}px "IBM Plex Mono", monospace`;
    }

    context.globalAlpha = glyph.alpha;
    context.fillText(glyph.glyph, offsetX + glyph.x * finalScale, offsetY + glyph.y * finalScale);
  }

  context.globalAlpha = 1;
}

export function renderToCanvas(
  canvas: HTMLCanvasElement,
  poem: string,
  brightnessMap: BrightnessMap,
  dimensions: RenderDimensions,
  settings: RenderSettings,
  options: RenderOptions
): void {
  const glyphs = buildRenderGlyphs(poem, brightnessMap, dimensions, settings.cellSize, settings.lineHeight);
  paintGlyphsToCanvas(canvas, glyphs, dimensions, settings, options);
}
