type ColorControlsProps = {
  textColor: string;
  backgroundColor: string;
  cellSize: number;
  detailStrength: number;
  lineHeight: number;
  wordSpacing: number;
  onTextColorChange: (value: string) => void;
  onBackgroundColorChange: (value: string) => void;
  onCellSizeChange: (value: number) => void;
  onDetailStrengthChange: (value: number) => void;
  onLineHeightChange: (value: number) => void;
  onWordSpacingChange: (value: number) => void;
};

export function ColorControls({
  textColor,
  backgroundColor,
  cellSize,
  detailStrength,
  lineHeight,
  wordSpacing,
  onTextColorChange,
  onBackgroundColorChange,
  onCellSizeChange,
  onDetailStrengthChange,
  onLineHeightChange,
  onWordSpacingChange,
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
      <label className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
        <span className="font-medium">Text details</span>
      </label>
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <label className="mt-1 block text-sm text-slate-700">
          Text size: <span className="font-semibold">{cellSize}px</span>
          <input
            type="range"
            min={6}
            max={26}
            step={1}
            value={cellSize}
            onChange={(event) => onCellSizeChange(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </label>
        <label className="mt-3 block text-sm text-slate-700">
          Detail: <span className="font-semibold">{detailStrength.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={detailStrength}
            onChange={(event) => onDetailStrengthChange(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </label>
        <label className="mt-2 block text-sm text-slate-700">
          Line height: <span className="font-semibold">{lineHeight.toFixed(2)}x</span>
          <input
            type="range"
            min={0.8}
            max={2}
            step={0.05}
            value={lineHeight}
            onChange={(event) => onLineHeightChange(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </label>
        <label className="mt-3 block text-sm text-slate-700">
          Word spacing: <span className="font-semibold">{wordSpacing}</span>
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={wordSpacing}
            onChange={(event) => onWordSpacingChange(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </label>
      </div>
    </section>
  );
}
