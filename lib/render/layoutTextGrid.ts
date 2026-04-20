import { BrightnessMap, RenderDimensions } from "./types";
import {
  layoutNextLineRange,
  materializeLineRange,
  prepareWithSegments,
  type LayoutCursor,
} from "@chenglou/pretext";

function normalizedPoem(poem: string): string {
  const compact = poem
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return compact.length > 0 ? compact : "visual poetry";
}

function sampleBrightnessAtCell(
  brightnessMap: BrightnessMap,
  col: number,
  row: number,
  cols: number,
  rows: number
): number {
  const sourceX = Math.min(
    brightnessMap.width - 1,
    Math.floor((col / Math.max(cols - 1, 1)) * (brightnessMap.width - 1))
  );
  const sourceY = Math.min(
    brightnessMap.height - 1,
    Math.floor((row / Math.max(rows - 1, 1)) * (brightnessMap.height - 1))
  );

  return brightnessMap.values[sourceY * brightnessMap.width + sourceX];
}

function estimateBackgroundBrightness(brightnessMap: BrightnessMap): number {
  const { width, height, values } = brightnessMap;
  const corners = [
    values[0],
    values[Math.max(0, width - 1)],
    values[Math.max(0, (height - 1) * width)],
    values[Math.max(0, height * width - 1)],
  ];
  return corners.reduce((sum, value) => sum + value, 0) / corners.length;
}

function rowSpanFromBrightness(
  brightnessMap: BrightnessMap,
  row: number,
  cols: number,
  rows: number
): { start: number; end: number } | null {
  const background = estimateBackgroundBrightness(brightnessMap);
  const deltaThreshold = 0.16;
  let first = -1;
  let last = -1;

  for (let col = 0; col < cols; col += 1) {
    const b = sampleBrightnessAtCell(brightnessMap, col, row, cols, rows);
    if (Math.abs(b - background) >= deltaThreshold) {
      if (first === -1) {
        first = col;
      }
      last = col;
    }
  }

  if (first === -1 || last === -1) {
    return null;
  }

  // Slightly pad to keep continuity in the silhouette rows.
  const pad = Math.max(1, Math.floor(cols * 0.01));
  return {
    start: Math.max(0, first - pad),
    end: Math.min(cols - 1, last + pad),
  };
}

function justifyToWidth(line: string, width: number): string {
  if (line.length >= width) {
    return line.slice(0, width);
  }

  const words = line.split(" ");
  if (words.length <= 1) {
    return line;
  }

  const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
  const gaps = words.length - 1;
  const targetSpaces = Math.max(gaps, width - totalWordLength);
  const basePerGap = Math.floor(targetSpaces / gaps);
  let extras = targetSpaces % gaps;

  let out = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const extra = extras > 0 ? 1 : 0;
    const spaces = " ".repeat(basePerGap + extra);
    out += `${spaces}${words[i]}`;
    if (extras > 0) {
      extras -= 1;
    }
  }

  return out.slice(0, width);
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
  rows: number,
  cellSize: number
): string[] {
  const output: string[] = new Array(cols * rows).fill(" ");
  const normalized = normalizedPoem(poem);
  const prepared = prepareWithSegments(normalized, `400 ${cellSize}px "IBM Plex Mono"`);
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  const startCursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

  for (let row = 0; row < rows; row += 1) {
    const span = rowSpanFromBrightness(brightnessMap, row, cols, rows);
    if (!span) {
      continue;
    }
    const { start, end } = span;
    const availableWidth = Math.max(1, end - start + 1);
    const availablePixelWidth = availableWidth * cellSize;

    let range = layoutNextLineRange(prepared, cursor, availablePixelWidth);
    if (range === null) {
      cursor = { ...startCursor };
      range = layoutNextLineRange(prepared, cursor, availablePixelWidth);
    }

    if (range === null) {
      continue;
    }

    const materialized = materializeLineRange(prepared, range);
    const readableLine = justifyToWidth(materialized.text.trimEnd(), availableWidth);
    cursor = range.end;

    for (let col = 0; col < availableWidth; col += 1) {
      output[row * cols + start + col] = readableLine[col] ?? " ";
    }
  }
  return output;
}
