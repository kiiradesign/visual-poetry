import { BrightnessMap, RenderDimensions } from "./types";

const DENSITY_RAMP = "@%#*+=-:. ";

function normalizedPoem(poem: string): string {
  const compact = poem.replace(/\r/g, "").replace(/\t/g, "  ").trim();
  return compact.length > 0 ? compact : "visual poetry";
}

export function getRenderDimensions(
  sourceWidth: number,
  sourceHeight: number,
  cellSize: number
): RenderDimensions {
  const cols = Math.max(1, Math.floor(sourceWidth / cellSize));
  const rows = Math.max(1, Math.floor(sourceHeight / cellSize));
  return {
    width: cols * cellSize,
    height: rows * cellSize,
    cols,
    rows,
  };
}

export function layoutTextGrid(
  poem: string,
  brightnessMap: BrightnessMap,
  cols: number,
  rows: number
): string[] {
  const source = normalizedPoem(poem);
  const output: string[] = new Array(cols * rows);
  const sourceWidth = brightnessMap.width;
  const sourceHeight = brightnessMap.height;
  let poemIndex = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const sourceX = Math.min(
        sourceWidth - 1,
        Math.floor((col / Math.max(cols - 1, 1)) * (sourceWidth - 1))
      );
      const sourceY = Math.min(
        sourceHeight - 1,
        Math.floor((row / Math.max(rows - 1, 1)) * (sourceHeight - 1))
      );
      const brightness = brightnessMap.values[sourceY * sourceWidth + sourceX];
      const densityIndex = Math.floor(brightness * (DENSITY_RAMP.length - 1));
      const densityChar = DENSITY_RAMP[densityIndex];

      if (densityChar === " ") {
        output[row * cols + col] = " ";
        continue;
      }

      output[row * cols + col] = source[poemIndex % source.length];
      poemIndex += 1;
    }
  }

  return output;
}
