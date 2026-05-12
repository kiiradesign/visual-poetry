import { CaretDown } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

type ExportPanelProps = {
  scale: number;
  canExport: boolean;
  onScaleChange: (value: number) => void;
  onExport: () => void;
  className?: string;
};

export function ExportPanel({ scale, canExport, onScaleChange, onExport, className }: ExportPanelProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-solid border-border bg-card px-4 py-3 text-card-foreground shadow-sm",
        className
      )}
    >
      <h2 className="text-base font-semibold">Export</h2>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <select
            value={scale}
            onChange={(event) => onScaleChange(Number(event.target.value))}
            className="vp-field h-8 w-full cursor-pointer appearance-none rounded-md pl-2.5 pr-7 text-sm"
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

        <div
          className="vp-field flex h-8 min-w-0 flex-1 cursor-default items-center justify-between rounded-md pl-2.5 pr-2 text-sm"
          aria-label="Export format"
        >
          <span>PNG</span>
          <CaretDown className="size-3.5 text-muted-foreground opacity-50" weight="bold" />
        </div>
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={!canExport}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-[transform,background-color,box-shadow,opacity] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-primary/90 active:scale-[0.97] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Export image
      </button>

      {!canExport ? (
        <p className="text-xs text-muted-foreground">
          Add poem text and a reference image before exporting.
        </p>
      ) : null}
    </section>
  );
}
