type ColorControlsProps = {
  textColor: string;
  backgroundColor: string;
  cellSize: number;
  onTextColorChange: (value: string) => void;
  onBackgroundColorChange: (value: string) => void;
  onCellSizeChange: (value: number) => void;
};

export function ColorControls({
  textColor,
  backgroundColor,
  cellSize,
  onTextColorChange,
  onBackgroundColorChange,
  onCellSizeChange,
}: ColorControlsProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Visual controls</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
          Text color
          <input type="color" value={textColor} onChange={(e) => onTextColorChange(e.target.value)} />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
          Background color
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
          />
        </label>
      </div>
      <label className="mt-3 block text-sm text-slate-700">
        Cell size: <span className="font-semibold">{cellSize}px</span>
        <input
          type="range"
          min={6}
          max={20}
          step={1}
          value={cellSize}
          onChange={(event) => onCellSizeChange(Number(event.target.value))}
          className="mt-2 w-full"
        />
      </label>
    </section>
  );
}
