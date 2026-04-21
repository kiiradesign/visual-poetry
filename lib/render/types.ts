export type BrightnessMap = {
  width: number;
  height: number;
  values: Float32Array;
};

export type LayoutMode = "pretext" | "legacy";

export type RenderSettings = {
  cellSize: number;
  lineHeight: number;
  wordSpacing: number;
  detailStrength: number;
  coverageBalance: number;
  textColor: string;
  backgroundColor: string;
  layoutMode: LayoutMode;
};

export type RenderDimensions = {
  width: number;
  height: number;
  cols: number;
  rows: number;
};
