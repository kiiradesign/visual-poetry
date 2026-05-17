/** Letter-by-letter reveal duration (preview and GIF export). */
export const RENDER_ANIMATION_MS = 2000;

/** GIF export frame rate — balances smoothness and encode time. */
export const GIF_EXPORT_FPS = 20;

/** Frame count chosen so delays can sum to exactly {@link RENDER_ANIMATION_MS}. */
export const GIF_EXPORT_FRAME_COUNT =
  (RENDER_ANIMATION_MS * GIF_EXPORT_FPS) / 1000;

/** Per-frame delays (ms) that sum to exactly {@link RENDER_ANIMATION_MS}. */
export function getGifFrameDelaysMs(): number[] {
  const frameCount = GIF_EXPORT_FRAME_COUNT;
  const baseDelayMs = Math.floor(RENDER_ANIMATION_MS / frameCount);
  const remainderMs = RENDER_ANIMATION_MS - baseDelayMs * frameCount;
  return Array.from({ length: frameCount }, (_, frame) =>
    baseDelayMs + (frame < remainderMs ? 1 : 0)
  );
}

/** Wall-clock elapsed at the end of GIF frame `frameIndex` (0 … frameCount − 1). */
export function gifFrameElapsedMs(frameIndex: number): number {
  if (GIF_EXPORT_FRAME_COUNT <= 1) {
    return RENDER_ANIMATION_MS;
  }
  return Math.min(
    RENDER_ANIMATION_MS,
    (frameIndex * RENDER_ANIMATION_MS) / (GIF_EXPORT_FRAME_COUNT - 1)
  );
}
