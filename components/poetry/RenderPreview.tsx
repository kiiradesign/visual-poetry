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
};

export function RenderPreview({
  poem,
  brightnessMap,
  textColor,
  backgroundColor,
  cellSize,
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

    const dimensions = getRenderDimensions(brightnessMap.width, brightnessMap.height, cellSize);
    renderToCanvas(canvasRef.current, poem, brightnessMap, dimensions, {
      cellSize,
      textColor,
      backgroundColor,
    });
  }, [backgroundColor, brightnessMap, cellSize, poem, textColor]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Live preview</h2>
      {errorMessage ? (
        <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
          {errorMessage}
        </div>
      ) : (
        <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
          <canvas ref={canvasRef} className="font-render max-h-[70vh] w-full object-contain" />
        </div>
      )}
    </section>
  );
}
