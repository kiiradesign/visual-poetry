import { CaretDown } from "@phosphor-icons/react";
import type { ExportFormat } from "@/lib/render/exportPng";

import { cn } from "@/lib/utils";

type ExportPanelProps = {
  scale: number;
  format: ExportFormat;
  canExport: boolean;
  isProcessing?: boolean;
  onScaleChange: (value: number) => void;
  onFormatChange: (value: ExportFormat) => void;
  onExport: () => void;
  className?: string;
};

export function ExportPanel({
  scale,
  format,
  canExport,
  isProcessing = false,
  onScaleChange,
  onFormatChange,
  onExport,
  className,
}: ExportPanelProps) {
  return (
    <section
      className={cn(
        "vp-panel flex flex-col gap-3 px-4 py-3",
        className
      )}
    >
      <div>
        <p className="vp-kicker">EXPORT</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="relative min-w-0">
          <select
            value={scale}
            onChange={(event) => onScaleChange(Number(event.target.value))}
            className="vp-field h-9 w-full cursor-pointer appearance-none rounded-[8px] pl-2.5 pr-7 text-sm"
            aria-label="Export scale"
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
          <CaretDown
            className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            weight="bold"
          />
        </div>

        <div className="relative min-w-0">
          <select
            value={format}
            onChange={(event) => onFormatChange(event.target.value as ExportFormat)}
            className="vp-field h-9 w-full cursor-pointer appearance-none rounded-[8px] pl-2.5 pr-7 text-sm"
            aria-label="Export format"
          >
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="gif">GIF</option>
          </select>
          <CaretDown
            className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            weight="bold"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={!canExport}
        className="vp-action vp-action-primary w-full rounded-[8px] px-3 py-2 text-sm font-semibold motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:active:scale-100"
      >
        Export artwork
      </button>

      {!canExport && !isProcessing ? (
        <p className="vp-copy text-xs">
          Add poem text and a reference image before exporting.
        </p>
      ) : null}
    </section>
  );
}
