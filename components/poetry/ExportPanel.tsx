type ExportPanelProps = {
  scale: number;
  canExport: boolean;
  onScaleChange: (value: number) => void;
  onExport: () => void;
};

export function ExportPanel({ scale, canExport, onScaleChange, onExport }: ExportPanelProps) {
  return (
    <section className="rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">Export</h2>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Resolution multiplier
          <select
            value={scale}
            onChange={(event) => onScaleChange(Number(event.target.value))}
            className="vp-field ml-2 inline-flex h-9 cursor-pointer items-center rounded-md px-2 py-1"
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </label>
        <button
          type="button"
          onClick={onExport}
          disabled={!canExport}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export PNG
        </button>
      </div>
      {!canExport ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Add poem text and a reference image before exporting.
        </p>
      ) : null}
    </section>
  );
}
