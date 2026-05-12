import { ThemeRange } from "@/components/theme-range";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type TextControlsProps = {
  cellSize: number;
  lineHeight: number;
  onCellSizeChange: (value: number) => void;
  onLineHeightChange: (value: number) => void;
  className?: string;
};

export function TextControls({
  cellSize,
  lineHeight,
  onCellSizeChange,
  onLineHeightChange,
  className,
}: TextControlsProps) {
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
    <section
      className={cn(
        "flex flex-col rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm",
        className
      )}
    >
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
  );
}

type VisualControlsProps = {
  textColor: string;
  backgroundColor: string;
  onTextColorChange: (value: string) => void;
  onBackgroundColorChange: (value: string) => void;
  className?: string;
};

export function VisualControls({
  textColor,
  backgroundColor,
  onTextColorChange,
  onBackgroundColorChange,
  className,
}: VisualControlsProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm",
        className
      )}
    >
      <h2 className="mb-4 text-xl font-semibold">Colors</h2>
      <div className="flex flex-col gap-2">
        <label className="flex items-center justify-between gap-3 rounded-md border border-solid border-border px-3 py-2 text-sm">
          <span>Text</span>
          <span className="flex items-center gap-2.5">
            <span className="font-mono text-xs uppercase tabular-nums text-muted-foreground">
              {textColor.toUpperCase()}
            </span>
            <ColorPicker
              id="text-color-picker"
              label="Text color"
              value={textColor}
              onChange={onTextColorChange}
            />
          </span>
        </label>
        <label className="flex items-center justify-between gap-3 rounded-md border border-solid border-border px-3 py-2 text-sm">
          <span>Background</span>
          <span className="flex items-center gap-2.5">
            <span className="font-mono text-xs uppercase tabular-nums text-muted-foreground">
              {backgroundColor.toUpperCase()}
            </span>
            <ColorPicker
              id="background-color-picker"
              label="Background color"
              value={backgroundColor}
              onChange={onBackgroundColorChange}
            />
          </span>
        </label>
      </div>
    </section>
  );
}
