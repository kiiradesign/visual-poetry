declare module "gifenc" {
  type GifPalette = number[][];

  type GifEncoderOptions = {
    auto?: boolean;
    initialCapacity?: number;
  };

  type WriteFrameOptions = {
    palette?: GifPalette;
    first?: boolean;
    transparent?: boolean;
    transparentIndex?: number;
    delay?: number;
    repeat?: number;
    dispose?: number;
  };

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: Record<string, unknown>
  ): GifPalette;

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GifPalette,
    format?: string
  ): Uint8Array;

  export function GIFEncoder(options?: GifEncoderOptions): {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: WriteFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
  };
}
