export type BrightnessMap = {
  width: number;
  height: number;
  values: Float32Array;
};

/**
 * Tonal contrast strength applied to glyph opacity. Held constant across the app:
 * - meaningful contrast spread between light/dark image regions
 * - below 0.72, so the export skips ASCII posterization and matches the preview
 */
export const DETAIL_STRENGTH = 0.65;

export type RenderSettings = {
  cellSize: number;
  lineHeight: number;
  textColor: string;
  backgroundColor: string;
};

export type RenderDimensions = {
  width: number;
  height: number;
  cols: number;
  rows: number;
};
