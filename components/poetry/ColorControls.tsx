import { ThemeRange } from "@/components/theme-range";
import { LayoutMode } from "@/lib/render/types";

type ColorControlsProps = {
  textColor: string;
  backgroundColor: string;
  cellSize: number;
  detailStrength: number;
  coverageBalance: number;
  lineHeight: number;
  wordSpacing: number;
  layoutMode: LayoutMode;
  onTextColorChange: (value: string) => void;
  onBackgroundColorChange: (value: string) => void;
  onCellSizeChange: (value: number) => void;
  onDetailStrengthChange: (value: number) => void;
  onCoverageBalanceChange: (value: number) => void;
  onLineHeightChange: (value: number) => void;
  onWordSpacingChange: (value: number) => void;
  onLayoutModeChange: (value: LayoutMode) => void;
};

export function ColorControls({
  textColor,
  backgroundColor,
  cellSize,
  detailStrength,
  coverageBalance,
  lineHeight,
  wordSpacing,
  layoutMode,
  onTextColorChange,
  onBackgroundColorChange,
  onCellSizeChange,
  onDetailStrengthChange,
  onCoverageBalanceChange,
  onLineHeightChange,
  onWordSpacingChange,
  onLayoutModeChange,
}: ColorControlsProps) {
  return (
    <section className="rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">Visual controls</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-md border border-solid border-border px-3 py-2 text-sm">
          Text color
          <input type="color" value={textColor} onChange={(e) => onTextColorChange(e.target.value)} />
        </label>
        <label className="flex items-center justify-between rounded-md border border-solid border-border px-3 py-2 text-sm">
          Background color
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
          />
        </label>
        <label className="flex items-center justify-between gap-2 rounded-md border border-solid border-border px-3 py-2 text-sm sm:col-span-2">
          Layout mode
          <select
            value={layoutMode}
            onChange={(event) => onLayoutModeChange(event.target.value as LayoutMode)}
            className="vp-field h-9 rounded-md px-2 py-1 text-sm"
          >
            <option value="pretext">Pretext (new)</option>
            <option value="legacy">Legacy (previous)</option>
          </select>
        </label>
      </div>
      <label className="mt-4 flex items-center justify-between rounded-md border border-solid border-border px-3 py-2 text-sm">
        <span className="font-medium">Text details</span>
      </label>
      <div className="mt-3 rounded-md border border-solid border-border p-3">
        <label className="mt-1 block text-sm">
          Text size: <span className="font-semibold">{cellSize}px</span>
          <ThemeRange
            min={6}
            max={26}
            step={1}
            value={cellSize}
            onChange={onCellSizeChange}
            className="mt-2 w-full"
            aria-label="Text size"
          />
        </label>
        <label className="mt-3 block text-sm">
          Detail: <span className="font-semibold">{detailStrength.toFixed(2)}</span>
          <ThemeRange
            min={0}
            max={1}
            step={0.05}
            value={detailStrength}
            onChange={onDetailStrengthChange}
            className="mt-2 w-full"
            aria-label="Detail strength"
          />
        </label>
        <label className="mt-2 block text-sm">
          Coverage vs detail: <span className="font-semibold">{coverageBalance.toFixed(2)}</span>
          <ThemeRange
            min={0}
            max={1}
            step={0.05}
            value={coverageBalance}
            onChange={onCoverageBalanceChange}
            className="mt-2 w-full"
            aria-label="Coverage versus detail"
          />
        </label>
        <label className="mt-2 block text-sm">
          Line height: <span className="font-semibold">{lineHeight.toFixed(2)}x</span>
          <ThemeRange
            min={0.8}
            max={2}
            step={0.05}
            value={lineHeight}
            onChange={onLineHeightChange}
            className="mt-2 w-full"
            aria-label="Line height"
          />
        </label>
        <label className="mt-3 block text-sm">
          Word spacing: <span className="font-semibold">{wordSpacing}</span>
          <ThemeRange
            min={1}
            max={6}
            step={1}
            value={wordSpacing}
            onChange={onWordSpacingChange}
            className="mt-2 w-full"
            aria-label="Word spacing"
          />
        </label>
      </div>
    </section>
  );
}
