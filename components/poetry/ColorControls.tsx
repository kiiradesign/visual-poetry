import { ThemeRange } from "@/components/theme-range";
import { ColorPicker } from "@/components/ui/color-picker";

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
    <>
      <section className="rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm">
        <h2 className="mb-2 text-xl font-semibold">Text</h2>
        <p className="mb-4 text-sm text-muted-foreground">Adjust the properties of the rendered text.</p>
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
      </section>

      <section className="rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Visuals</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-md border border-solid border-border px-3 py-2 text-sm">
            Text color
            <ColorPicker
              id="text-color-picker"
              label="Text color"
              value={textColor}
              onChange={onTextColorChange}
            />
          </label>
          <label className="flex items-center justify-between rounded-md border border-solid border-border px-3 py-2 text-sm">
            Background color
            <ColorPicker
              id="background-color-picker"
              label="Background color"
              value={backgroundColor}
              onChange={onBackgroundColorChange}
            />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          Details: <span className="font-semibold">{detailStrength.toFixed(2)}</span>
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
      </section>
    </>
  );
}
