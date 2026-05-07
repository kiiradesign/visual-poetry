export type BrightnessMap = {
  width: number;
  height: number;
  values: Float32Array;
};

export type RenderSettings = {
  cellSize: number;
  lineHeight: number;
  detailStrength: number;
  textColor: string;
  backgroundColor: string;
};

export type RenderDimensions = {
  width: number;
  height: number;
  cols: number;
  rows: number;
};
