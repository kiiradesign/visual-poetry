import { ThemeRange } from "@/components/theme-range";
import { ColorPicker } from "@/components/ui/color-picker";
import { useEffect, useState } from "react";

type ColorControlsProps = {
  textColor: string;
  backgroundColor: string;
  cellSize: number;
  detailStrength: number;
  lineHeight: number;
  onTextColorChange: (value: string) => void;
  onBackgroundColorChange: (value: string) => void;
  onCellSizeChange: (value: number) => void;
  onDetailStrengthChange: (value: number) => void;
  onLineHeightChange: (value: number) => void;
};

export function ColorControls({
  textColor,
  backgroundColor,
  cellSize,
  detailStrength,
  lineHeight,
  onTextColorChange,
  onBackgroundColorChange,
  onCellSizeChange,
  onDetailStrengthChange,
  onLineHeightChange,
}: ColorControlsProps) {
  const maxCellSizePx = 50;
  const defaultTextSizePercent = 20;
  const defaultLineHeightPercent = 110;
  const cellSizePercent = Math.max(1, Math.min(100, Math.round((cellSize / maxCellSizePx) * 100)));
  const lineHeightPercent = Math.max(80, Math.min(200, Math.round(lineHeight * 100)));
  const [textSizeInput, setTextSizeInput] = useState(String(cellSizePercent));
  const [lineHeightInput, setLineHeightInput] = useState(String(lineHeightPercent));

  useEffect(() => {
    setTextSizeInput(String(cellSizePercent));
  }, [cellSizePercent]);

  useEffect(() => {
    setLineHeightInput(String(lineHeightPercent));
  }, [lineHeightPercent]);

  function commitTextSizeInput(rawValue: string) {
    const parsed = Number(rawValue);
    const normalized = Number.isFinite(parsed) && parsed >= 1 && parsed <= 100 ? Math.round(parsed) : defaultTextSizePercent;
    const mappedPx = Math.max(1, Math.min(maxCellSizePx, (normalized / 100) * maxCellSizePx));
    onCellSizeChange(mappedPx);
    setTextSizeInput(String(normalized));
  }

  function commitLineHeightInput(rawValue: string) {
    const parsed = Number(rawValue);
    const normalized =
      Number.isFinite(parsed) && parsed >= 80 && parsed <= 200 ? Math.round(parsed) : defaultLineHeightPercent;
    onLineHeightChange(normalized / 100);
    setLineHeightInput(String(normalized));
  }

  return (
    <>
      <section className="flex h-full min-h-[220px] flex-col rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Text</h2>
        <label className="mt-1 block text-sm">
          <span className="flex items-center justify-between gap-2">
            <span>
              Text size: <span className="font-semibold">{cellSizePercent}%</span>
            </span>
            <span className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                value={textSizeInput}
                onChange={(event) => setTextSizeInput(event.target.value)}
                onBlur={() => commitTextSizeInput(textSizeInput)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitTextSizeInput(textSizeInput);
                  }
                }}
                className="vp-field h-8 w-16 rounded-md px-2 text-right text-sm"
                aria-label="Text size percentage"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </span>
          </span>
          <ThemeRange
            min={1}
            max={100}
            step={1}
            value={cellSizePercent}
            onChange={(percent) => {
              const mappedPx = Math.max(1, Math.min(maxCellSizePx, (percent / 100) * maxCellSizePx));
              onCellSizeChange(mappedPx);
            }}
            className="mt-2 w-full"
            aria-label="Text size"
          />
        </label>
        <label className="mt-5 block text-sm">
          <span className="flex items-center justify-between gap-2">
            <span>
              Line height: <span className="font-semibold">{lineHeightPercent}%</span>
            </span>
            <span className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                value={lineHeightInput}
                onChange={(event) => setLineHeightInput(event.target.value)}
                onBlur={() => commitLineHeightInput(lineHeightInput)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitLineHeightInput(lineHeightInput);
                  }
                }}
                className="vp-field h-8 w-16 rounded-md px-2 text-right text-sm"
                aria-label="Line height percentage"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </span>
          </span>
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
      </section>

      <section className="flex h-full min-h-[220px] flex-col rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Visuals</h2>
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
        <label className="mt-5 block text-sm">
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
