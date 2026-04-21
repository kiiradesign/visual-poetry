import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { getRenderDimensions, layoutTextGrid, sampleBrightnessAtCell } from "@/lib/render/layoutTextGrid";
import { BrightnessMap } from "@/lib/render/types";

type RenderPreviewProps = {
  poem: string;
  brightnessMap: BrightnessMap | null;
  textColor: string;
  backgroundColor: string;
  cellSize: number;
  lineHeight: number;
  wordSpacing: number;
  detailStrength: number;
  animationToken: number;
};

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

export function RenderPreview({
  poem,
  brightnessMap,
  textColor,
  backgroundColor,
  cellSize,
  lineHeight,
  wordSpacing,
  detailStrength,
  animationToken,
}: RenderPreviewProps) {
  const errorMessage = !poem.trim()
    ? "Add poem text to generate a preview."
    : !brightnessMap
      ? "Upload a reference image to generate preview."
      : null;

  const dimensions = useMemo(() => {
    if (!brightnessMap) {
      return null;
    }
    return getRenderDimensions(brightnessMap.width, brightnessMap.height, cellSize, lineHeight);
  }, [brightnessMap, cellSize, lineHeight]);

  const glyphs = useMemo(() => {
    if (!brightnessMap || !dimensions || !poem.trim()) {
      return [];
    }
    const grid = layoutTextGrid(
      poem,
      brightnessMap,
      dimensions.cols,
      dimensions.rows,
      cellSize,
      wordSpacing
    );

    const rowStep = Math.max(1, Math.floor(cellSize * lineHeight));
    const backgroundBrightness = estimateBackgroundBrightness(brightnessMap);
    const points: Array<{ glyph: string; x: number; y: number; col: number; row: number; order: number }> = [];
    for (let row = 0; row < dimensions.rows; row += 1) {
      for (let col = 0; col < dimensions.cols; col += 1) {
        const glyph = grid[row * dimensions.cols + col];
        if (glyph !== " ") {
          points.push({
            glyph,
            x: col * cellSize,
            y: row * rowStep,
            col,
            row,
            order: row * dimensions.cols + col,
          });
        }
      }
    }

    const sliderStrength = Math.max(0, Math.min(1, detailStrength));
    const tonalSignals = new Float32Array(points.length);
    let minSignal = Number.POSITIVE_INFINITY;
    let maxSignal = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const brightness = sampleBrightnessAtCell(
        brightnessMap,
        p.col,
        p.row,
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

    const withStyle = points.map((p, i) => {
      const normalized = Math.max(0, Math.min(1, (tonalSignals[i] - minSignal) / signalRange));
      const curved = Math.pow(normalized, 0.72);
      const contrastBoost = 1 + sliderStrength * 3.1;
      const contrasted = Math.max(0, Math.min(1, (curved - 0.5) * contrastBoost + 0.5));
      const contrastedAlpha = minAlpha + (maxAlpha - minAlpha) * contrasted;
      const alpha = Math.max(minAlpha, Math.min(1, baseAlpha + (contrastedAlpha - baseAlpha) * sliderStrength));
      const weight = Math.round((300 + normalized * 400) / 100) * 100;
      return { ...p, alpha, weight };
    });

    withStyle.sort((a, b) => a.y - b.y || a.x - b.x || a.order - b.order);
    return withStyle;
  }, [brightnessMap, cellSize, detailStrength, dimensions, lineHeight, poem, wordSpacing]);

  const drawDurationSeconds = 3.5;
  const delayStep = glyphs.length > 0 ? drawDurationSeconds / glyphs.length : 0;
  const animatedTokenRef = useRef<number | null>(null);
  const shouldAnimate = animatedTokenRef.current !== animationToken;

  useEffect(() => {
    animatedTokenRef.current = animationToken;
  }, [animationToken]);

  return (
    <section className="rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">Live preview</h2>
      {errorMessage ? (
        <div
          className="flex h-80 items-center justify-center rounded-md border border-dashed border-solid border-border/80 px-6 text-center text-sm shadow-inner"
          style={{ backgroundColor, color: textColor }}
        >
          {errorMessage}
        </div>
      ) : (
        <div
          className="overflow-auto rounded-md border border-solid border-border p-2 shadow-inner"
          style={{ backgroundColor }}
        >
          {dimensions ? (
            <div
              key={`preview-${animationToken}`}
              className="font-render relative"
              style={{ width: dimensions.width, height: dimensions.height }}
            >
              {glyphs.map((point, index) => (
                <motion.span
                  key={`${point.order}-${index}`}
                  className="absolute whitespace-pre leading-none"
                  style={{
                    left: point.x,
                    top: point.y,
                    color: textColor,
                    fontSize: `${cellSize}px`,
                    fontWeight: point.weight,
                  }}
                  initial={shouldAnimate ? { opacity: 0, scale: 1.5 } : false}
                  animate={{ opacity: point.alpha, scale: 1 }}
                  transition={{
                    duration: shouldAnimate ? 0.05 : 0,
                    delay: shouldAnimate ? index * delayStep : 0,
                    ease: "linear",
                  }}
                >
                  {point.glyph}
                </motion.span>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
