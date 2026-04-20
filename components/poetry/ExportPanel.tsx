type ExportPanelProps = {
  scale: number;
  canExport: boolean;
  onScaleChange: (value: number) => void;
  onExport: () => void;
};

export function ExportPanel({ scale, canExport, onScaleChange, onExport }: ExportPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Export</h2>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-700">
          Resolution multiplier
          <select
            value={scale}
            onChange={(event) => onScaleChange(Number(event.target.value))}
            className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
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
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Export PNG
        </button>
      </div>
      {!canExport ? (
        <p className="mt-2 text-xs text-slate-500">
          Add poem text and a reference image before exporting.
        </p>
      ) : null}
    </section>
  );
}
