import { useEffect, useRef } from "react";
import { getRenderDimensions } from "@/lib/render/layoutTextGrid";
import { renderToCanvas } from "@/lib/render/renderToCanvas";
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
};

export function RenderPreview({
  poem,
  brightnessMap,
  textColor,
  backgroundColor,
  cellSize,
  lineHeight,
  wordSpacing,
  detailStrength,
}: RenderPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const errorMessage = !poem.trim()
    ? "Add poem text to generate a preview."
    : !brightnessMap
      ? "Upload a reference image to generate preview."
      : null;

  useEffect(() => {
    if (!brightnessMap || !canvasRef.current || !poem.trim()) {
      return;
    }

    const dimensions = getRenderDimensions(
      brightnessMap.width,
      brightnessMap.height,
      cellSize,
      lineHeight
    );
    renderToCanvas(canvasRef.current, poem, brightnessMap, dimensions, {
      cellSize,
      lineHeight,
      wordSpacing,
      detailStrength,
      textColor,
      backgroundColor,
    });
  }, [backgroundColor, brightnessMap, cellSize, detailStrength, lineHeight, poem, textColor, wordSpacing]);

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
          <canvas ref={canvasRef} className="font-render max-h-[70vh] w-full object-contain" />
        </div>
      )}
    </section>
  );
}
