import { Slider, type DialTheme } from "dialkit";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";

type DetailControlsProps = {
  cellSize: number;
  lineHeight: number;
  zoom: number;
  theme: DialTheme;
  onCellSizeChange: (value: number) => void;
  onLineHeightChange: (value: number) => void;
  onZoomChange: (value: number) => void;
  className?: string;
};

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 1.5;
const MAX_CELL_SIZE = 50;

export function DetailControls({
  cellSize,
  lineHeight,
  zoom,
  theme,
  onCellSizeChange,
  onLineHeightChange,
  onZoomChange,
  className,
}: DetailControlsProps) {
  const cellSizePercent = Math.max(1, Math.min(100, Math.round((cellSize / MAX_CELL_SIZE) * 100)));
  const lineHeightPercent = Math.max(80, Math.min(200, Math.round(lineHeight * 100)));
  const zoomPercent = Math.max(
    Math.round(ZOOM_MIN * 100),
    Math.min(Math.round(ZOOM_MAX * 100), Math.round(zoom * 100))
  );

  return (
    <section
      className={cn(
        "vp-panel dialkit-root flex flex-col p-4",
        className
      )}
      data-theme={theme}
    >
      <div className="mb-4">
        <p className="vp-kicker">PARAMETERS</p>
      </div>
      <div className="flex flex-col gap-2">
        <Slider
          label="Text size"
          value={cellSizePercent}
          min={1}
          max={100}
          step={1}
          unit="%"
          onChange={(percent) => {
            const mappedPx = Math.max(1, Math.min(MAX_CELL_SIZE, (percent / 100) * MAX_CELL_SIZE));
            onCellSizeChange(mappedPx);
          }}
        />
        <Slider
          label="Line height"
          value={lineHeightPercent}
          min={80}
          max={200}
          step={5}
          unit="%"
          onChange={(percent) => onLineHeightChange(percent / 100)}
        />
        <Slider
          label="Zoom"
          value={zoomPercent}
          min={Math.round(ZOOM_MIN * 100)}
          max={Math.round(ZOOM_MAX * 100)}
          step={5}
          unit="%"
          onChange={(percent) => onZoomChange(percent / 100)}
        />
      </div>
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
        "vp-panel flex flex-col p-4",
        className
      )}
    >
      <div className="mb-4">
        <p className="vp-kicker">PALETTE</p>
      </div>
      <div className="flex flex-col gap-2">
        <label className="vp-row flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <span className="vp-copy">Text</span>
          <span className="flex items-center gap-2.5">
            <span className="vp-row-value text-xs uppercase tabular-nums">
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
        <label className="vp-row flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <span className="vp-copy">Background</span>
          <span className="flex items-center gap-2.5">
            <span className="vp-row-value text-xs uppercase tabular-nums">
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
