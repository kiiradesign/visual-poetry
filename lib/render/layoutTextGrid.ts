import { BrightnessMap, RenderDimensions } from "./types";

function normalizedPoem(poem: string): string {
  const compact = poem
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return compact.length > 0 ? compact : "visual poetry";
}

export function sampleBrightnessAtCell(
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

function minWordCells(wordLength: number): number {
  return Math.max(1, wordLength);
}

function letterStepForFit(wordLength: number, remaining: number): number {
  if (wordLength <= 1) {
    return 1;
  }
  // Keep letters contiguous to preserve readability.
  const needed = wordLength;
  if (needed <= remaining) {
    return 1;
  }
  return 1;
}

export function getRenderDimensions(
  sourceWidth: number,
  sourceHeight: number,
  cellSize: number,
  lineHeight: number
): RenderDimensions {
  const rowStep = Math.max(1, Math.floor(cellSize * lineHeight));
  const cols = Math.max(1, Math.floor(sourceWidth / cellSize));
  const rows = Math.max(1, Math.floor(sourceHeight / rowStep));
  return {
    width: cols * cellSize,
    height: rows * rowStep,
    cols,
    rows,
  };
}

export function layoutTextGrid(
  poem: string,
  brightnessMap: BrightnessMap,
  cols: number,
  rows: number,
  cellSize: number,
  wordSpacing: number,
  detailStrength: number
): string[] {
  void cellSize;
  const output: string[] = new Array(cols * rows).fill(" ");
  const words = normalizedPoem(poem).split(" ");
  let wordIndex = 0;
  const totalWords = words.length;
  const detailBias = Math.min(1, Math.max(0, detailStrength));
  const preferredGap = Math.max(1, Math.round(wordSpacing));

  for (let row = 0; row < rows; row += 1) {
    const span = rowSpanFromBrightness(brightnessMap, row, cols, rows);
    if (!span) {
      continue;
    }

    const inset = Math.max(1, Math.round((1 - detailBias) * 2));
    const drawStart = Math.min(cols - 1, span.start + inset);
    const drawEnd = Math.max(drawStart, span.end - inset);
    const spanWidth = drawEnd - drawStart + 1;
    if (spanWidth <= 0) {
      continue;
    }

    let cursor = drawStart;
    while (cursor <= drawEnd) {
      const word = words[wordIndex];
      const remaining = drawEnd - cursor + 1;
      if (remaining <= 0) {
        break;
      }

      if (minWordCells(word.length) > remaining) {
        break;
      }

      const letterStep = letterStepForFit(word.length, remaining);
      const needed = 1 + (word.length - 1) * letterStep;
      if (needed > remaining) {
        break;
      }

      for (let i = 0; i < word.length; i += 1) {
        const drawCol = cursor + i * letterStep;
        if (drawCol > drawEnd) {
          break;
        }
        output[row * cols + drawCol] = word[i];
      }
      cursor += needed;
      wordIndex = (wordIndex + 1) % totalWords;

      const minSpaceToNextWord = minWordCells(words[wordIndex].length);
      const remainingAfterWord = drawEnd - cursor + 1;
      if (remainingAfterWord <= minSpaceToNextWord) {
        break;
      }

      const gap = Math.min(preferredGap, remainingAfterWord - minSpaceToNextWord);
      cursor += Math.max(1, gap);
    }
  }

  return output;
}
