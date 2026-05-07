import {
  layoutNextLineRange,
  materializeLineRange,
  prepareWithSegments,
  type LayoutCursor,
} from "@chenglou/pretext";
import { BrightnessMap, RenderDimensions } from "./types";

const MAX_GRID_CELLS = 140_000;

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
  rows: number,
  coverageBalance: number
): { start: number; end: number } | null {
  const background = estimateBackgroundBrightness(brightnessMap);
  // Coverage-heavy mode accepts softer contrast; detail-heavy mode needs stronger boundaries.
  const deltaThreshold = 0.16 - Math.max(0, Math.min(1, coverageBalance)) * 0.05;
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

  // Avoid automatic expansion to reduce outer halo around silhouette.
  const pad = Math.max(0, Math.floor(cols * 0.005));
  return {
    start: Math.max(0, first - pad),
    end: Math.min(cols - 1, last + pad),
  };
}

function makeLoopedText(text: string, minChars: number): string {
  if (text.length === 0) {
    return text;
  }
  const parts: string[] = [];
  let total = 0;
  while (total < minChars) {
    parts.push(text);
    // Always join with a single spacer so wrap never creates accidental hard seams.
    total += text.length + 1;
  }
  return parts.join(" ");
}

function trackingVariantSeed(row: number, runStart: number, wordLength: number): number {
  return (row * 131 + runStart * 67 + wordLength * 29) % 1009;
}

export function getRenderDimensions(
  sourceWidth: number,
  sourceHeight: number,
  cellSize: number,
  lineHeight: number
): RenderDimensions {
  const rowStep = Math.max(1, Math.floor(cellSize * lineHeight));
  let cols = Math.max(1, Math.floor(sourceWidth / cellSize));
  let rows = Math.max(1, Math.floor(sourceHeight / rowStep));
  const totalCells = cols * rows;
  if (totalCells > MAX_GRID_CELLS) {
    const scale = Math.sqrt(MAX_GRID_CELLS / totalCells);
    cols = Math.max(1, Math.floor(cols * scale));
    rows = Math.max(1, Math.floor(rows * scale));
  }
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
  cellSize: number
): string[] {
  const coverageBalance = 0.7;
  return layoutTextGridPretext(
    poem,
    brightnessMap,
    cols,
    rows,
    cellSize,
    coverageBalance
  );
}

function layoutTextGridPretext(
  poem: string,
  brightnessMap: BrightnessMap,
  cols: number,
  rows: number,
  cellSize: number,
  coverageBalance: number
): string[] {
  const output: string[] = new Array(cols * rows).fill(" ");
  const coverage = Math.max(0, Math.min(1, coverageBalance));
  const background = estimateBackgroundBrightness(brightnessMap);
  const subjectThreshold = 0.145 - coverage * 0.025;
  const baseText = normalizedPoem(poem);
  const spacedText = baseText;
  // Build a long loop so "end-of-poem" rarely occurs during a frame. This avoids
  // visible restart seams/glitches when the text wraps.
  const expectedGlyphBudget = Math.max(4000, cols * rows * 6);
  const loopedText = makeLoopedText(spacedText, expectedGlyphBudget);
  const prepped = prepareWithSegments(loopedText, `400 ${cellSize}px "IBM Plex Mono", monospace`, {
    wordBreak: "keep-all",
  });
  const startCursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  let cursor: LayoutCursor = startCursor;

  function isSubjectCell(row: number, col: number): boolean {
    const brightness = sampleBrightnessAtCell(brightnessMap, col, row, cols, rows);
    return Math.abs(brightness - background) >= subjectThreshold;
  }

  function subjectRunsForRow(row: number, minCol: number, maxCol: number): Array<{ start: number; end: number }> {
    const runs: Array<{ start: number; end: number }> = [];
    let runStart = -1;
    for (let col = minCol; col <= maxCol; col += 1) {
      const inSubject = isSubjectCell(row, col);
      if (inSubject && runStart === -1) {
        runStart = col;
      } else if (!inSubject && runStart !== -1) {
        runs.push({ start: runStart, end: col - 1 });
        runStart = -1;
      }
    }
    if (runStart !== -1) {
      runs.push({ start: runStart, end: maxCol });
    }
    return runs;
  }

  function placeWordWithTracking(
    row: number,
    runStart: number,
    runEnd: number,
    cursorCol: number,
    word: string,
    preferredGap: number
  ): { placed: boolean; nextCursor: number } {
    const remaining = runEnd - cursorCol + 1;
    if (remaining <= 0) {
      return { placed: false, nextCursor: cursorCol };
    }
    const minNeeded = word.length;
    if (minNeeded > remaining) {
      return { placed: false, nextCursor: cursorCol };
    }

    // Per-word tracking varies by row/run to avoid overly uniform glyph cadence,
    // while staying bounded so words still fit silhouette runs reliably.
    const maxStepByWordGap = Math.max(1, preferredGap + 1);
    const maxVisualStep = word.length >= 6 ? 3 : 2;
    const maxTrackingStep = Math.min(maxVisualStep, maxStepByWordGap);
    const seed = trackingVariantSeed(row, runStart, word.length);
    let letterStep = 1;
    if (maxTrackingStep >= 3 && seed % 11 < 3) {
      letterStep = 3;
    } else if (maxTrackingStep >= 2 && seed % 7 < 3) {
      letterStep = 2;
    }
    while (letterStep > 1) {
      const needed = 1 + (word.length - 1) * letterStep;
      if (needed <= remaining) {
        break;
      }
      letterStep -= 1;
    }
    const needed = 1 + (word.length - 1) * letterStep;
    if (needed > remaining) {
      return { placed: false, nextCursor: cursorCol };
    }

    for (let i = 0; i < word.length; i += 1) {
      const col = cursorCol + i * letterStep;
      output[row * cols + col] = word[i];
    }
    return { placed: true, nextCursor: cursorCol + needed };
  }

  function placeWordFragment(
    row: number,
    cursorCol: number,
    fragment: string
  ): { placed: boolean; nextCursor: number } {
    if (fragment.length === 0) {
      return { placed: false, nextCursor: cursorCol };
    }
    for (let i = 0; i < fragment.length; i += 1) {
      output[row * cols + cursorCol + i] = fragment[i];
    }
    return { placed: true, nextCursor: cursorCol + fragment.length };
  }

  for (let row = 0; row < rows; row += 1) {
    const span = rowSpanFromBrightness(brightnessMap, row, cols, rows, coverageBalance);
    if (!span) {
      continue;
    }

    // Pretext mode keeps row bounds looser so text can hug complex silhouettes.
    const inset = 0;
    const drawStart = Math.min(cols - 1, span.start + inset);
    const drawEnd = Math.max(drawStart, span.end - inset);
    const spanWidth = drawEnd - drawStart + 1;
    if (spanWidth <= 0) {
      continue;
    }

    // Small overlap helps continuity without re-introducing edge halos.
    const overlapCells = Math.max(0, Math.round(coverage * 2));
    const layoutWidthPx = Math.max(cellSize, (spanWidth + overlapCells * 2) * cellSize);

    const cursorBefore = cursor;
    let lineRange = layoutNextLineRange(prepped, cursorBefore, layoutWidthPx);
    if (!lineRange) {
      cursor = startCursor;
      lineRange = layoutNextLineRange(prepped, cursor, layoutWidthPx);
      if (!lineRange) {
        continue;
      }
    }
    const firstLine = materializeLineRange(prepped, lineRange);
    let activeLine = firstLine;

    const minCol = Math.max(0, span.start - overlapCells);
    const maxCol = Math.min(cols - 1, span.end + overlapCells);
    const availableWidth = maxCol - minCol + 1;
    if (availableWidth <= 0) {
      continue;
    }

    // Re-request narrower lines if needed so words fit the silhouette runs
    // without chopping letters.
    let tryWidthCells = spanWidth + overlapCells * 2;
    const runs = subjectRunsForRow(row, minCol, maxCol);
    if (runs.length === 0) {
      continue;
    }
    const totalRunWidth = runs.reduce((sum, run) => sum + (run.end - run.start + 1), 0);
    while (tryWidthCells >= 2) {
      const lineWords = activeLine.text.trim().split(/\s+/).filter(Boolean);
      const minNeeded = lineWords.reduce((sum, word) => sum + word.length, 0);
      if (minNeeded <= totalRunWidth) {
        break;
      }
      tryWidthCells -= 1;
      const narrowed = layoutNextLineRange(prepped, cursorBefore, Math.max(cellSize, tryWidthCells * cellSize));
      if (!narrowed) {
        break;
      }
      activeLine = materializeLineRange(prepped, narrowed);
    }

    const words = activeLine.text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      continue;
    }

    const preferredGap = 1;
    let wordIndex = 0;
    let placedAny = false;

    for (const run of runs) {
      let cursorCol = run.start;
      const runWidth = run.end - run.start + 1;
      if (runWidth >= 10) {
        const stagger = (row * 13 + run.start * 7) % 2;
        cursorCol = Math.min(run.end, run.start + stagger);
      }
      while (wordIndex < words.length) {
        const word = words[wordIndex];
        let placement = placeWordWithTracking(row, run.start, run.end, cursorCol, word, preferredGap);
        if (!placement.placed && cursorCol !== run.start) {
          // If stagger start doesn't fit, retry from original run start so
          // we preserve text density.
          cursorCol = run.start;
          placement = placeWordWithTracking(row, run.start, run.end, cursorCol, word, preferredGap);
        }
        if (!placement.placed) {
          // Allow soft word continuation (without hyphen) when a run has room for
          // only part of the current word. Remainder continues on the next run/row.
          const remaining = run.end - cursorCol + 1;
          if (remaining > 0 && remaining < word.length) {
            const fragment = word.slice(0, remaining);
            const remainder = word.slice(remaining);
            const fragmentPlacement = placeWordFragment(row, cursorCol, fragment);
            if (fragmentPlacement.placed) {
              placedAny = true;
              words[wordIndex] = remainder;
            }
          }
          break;
        }
        placedAny = true;
        wordIndex += 1;
        cursorCol = placement.nextCursor;

        if (wordIndex >= words.length) {
          break;
        }

        const nextWord = words[wordIndex];
        const remainingAfterWord = run.end - cursorCol + 1;
        const minNeededForNext = nextWord.length;
        if (remainingAfterWord <= minNeededForNext) {
          break;
        }
        if (remainingAfterWord < preferredGap + minNeededForNext) {
          break;
        }
        cursorCol += preferredGap;
      }
      if (wordIndex >= words.length) {
        break;
      }
    }

    if (!placedAny) {
      continue;
    }
    cursor = activeLine.end;
  }

  return output;
}
