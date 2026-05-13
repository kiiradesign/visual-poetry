import { useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DotmSquare11 } from "@/components/ui/dotm-square-11";
import { getRenderDimensions } from "@/lib/render/layoutTextGrid";
import { buildRenderGlyphs, paintGlyphsToCanvas } from "@/lib/render/renderToCanvas";
import { BrightnessMap } from "@/lib/render/types";

type ViewportSize = { width: number; height: number };

const PREVIEW_LOADER_SPEED = 1.5;
const PREVIEW_LOADER_EXIT_MS = 180;
const PREVIEW_LOADER_TOTAL_MS = 1200;
const PREVIEW_LOADER_CYCLE_MS = PREVIEW_LOADER_TOTAL_MS - PREVIEW_LOADER_EXIT_MS;
const PREVIEW_RENDER_MS = 2000;

type RenderPreviewProps = {
  poem: string;
  brightnessMap: BrightnessMap | null;
  textColor: string;
  backgroundColor: string;
  cellSize: number;
  lineHeight: number;
  zoom: number;
  isProcessing?: boolean;
  processingToken?: number;
  animationToken: number;
  onViewportChange?: (size: ViewportSize) => void;
  onRenderAnimationStateChange?: (isAnimating: boolean) => void;
};

export function RenderPreview({
  poem,
  brightnessMap,
  textColor,
  backgroundColor,
  cellSize,
  lineHeight,
  zoom,
  isProcessing = false,
  processingToken = 0,
  animationToken,
  onViewportChange,
  onRenderAnimationStateChange,
}: RenderPreviewProps) {
  const [loaderCycleComplete, setLoaderCycleComplete] = useState(!isProcessing && processingToken <= 0);
  const [showLoaderOverlay, setShowLoaderOverlay] = useState(isProcessing || processingToken > 0);
  const [isLoaderFading, setIsLoaderFading] = useState(false);
  const [revealedAnimationToken, setRevealedAnimationToken] = useState<number | null>(null);
  const [viewportNode, setViewportNode] = useState<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const onViewportChangeRef = useRef(onViewportChange);
  const onRenderAnimationStateChangeRef = useRef(onRenderAnimationStateChange);
  const animatedTokenRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const shouldUseLoader = processingToken > 0;
  const showLoader = isProcessing || (shouldUseLoader && showLoaderOverlay);
  const showEmptyPoemLoader = !showLoader && !poem.trim();
  const statusMessage =
    showLoader || showEmptyPoemLoader
      ? null
      : !brightnessMap
        ? "Upload a reference image to generate preview."
        : null;

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    onRenderAnimationStateChangeRef.current = onRenderAnimationStateChange;
  }, [onRenderAnimationStateChange]);

  useLayoutEffect(() => {
    if (!viewportNode) {
      return;
    }

    const initialRect = viewportNode.getBoundingClientRect();
    const initialSize = { width: initialRect.width, height: initialRect.height };
    setViewportSize(initialSize);
    onViewportChangeRef.current?.(initialSize);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const next = { width: entry.contentRect.width, height: entry.contentRect.height };
        setViewportSize(next);
        onViewportChangeRef.current?.(next);
      }
    });

    observer.observe(viewportNode);
    return () => observer.disconnect();
  }, [viewportNode]);

  const dimensions = useMemo(() => {
    if (!brightnessMap) {
      return null;
    }
    return getRenderDimensions(brightnessMap.width, brightnessMap.height, cellSize, lineHeight);
  }, [brightnessMap, cellSize, lineHeight]);

  const renderGlyphs = useMemo(() => {
    if (!brightnessMap || !dimensions || !poem.trim()) {
      return [];
    }
    return buildRenderGlyphs(poem, brightnessMap, dimensions, cellSize, lineHeight);
  }, [brightnessMap, cellSize, dimensions, lineHeight, poem]);

  const canRenderPreview = Boolean(
    dimensions && brightnessMap && poem.trim() && viewportSize.width > 0 && viewportSize.height > 0
  );
  const isRenderMounted = canRenderPreview && revealedAnimationToken === animationToken;
  const shouldAnimate = isRenderMounted && !prefersReducedMotion && animatedTokenRef.current !== animationToken;

  useEffect(() => {
    if (!shouldUseLoader) {
      setShowLoaderOverlay(false);
      setIsLoaderFading(false);
      setLoaderCycleComplete(true);
      return;
    }

    setLoaderCycleComplete(false);
    setShowLoaderOverlay(true);
    setIsLoaderFading(false);
    setRevealedAnimationToken(null);

    const timer = window.setTimeout(() => {
      setLoaderCycleComplete(true);
    }, PREVIEW_LOADER_CYCLE_MS);

    return () => window.clearTimeout(timer);
  }, [processingToken, shouldUseLoader]);

  useEffect(() => {
    if (!showLoaderOverlay || isProcessing || !loaderCycleComplete || !canRenderPreview) {
      return;
    }

    setRevealedAnimationToken(animationToken);
    setIsLoaderFading(true);

    const timer = window.setTimeout(() => {
      setShowLoaderOverlay(false);
      setIsLoaderFading(false);
    }, PREVIEW_LOADER_EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [animationToken, canRenderPreview, isProcessing, loaderCycleComplete, showLoaderOverlay]);

  useEffect(() => {
    if (!showLoaderOverlay || isProcessing || !loaderCycleComplete || canRenderPreview) {
      return;
    }

    setShowLoaderOverlay(false);
    setIsLoaderFading(false);
  }, [canRenderPreview, isProcessing, loaderCycleComplete, showLoaderOverlay]);

  useEffect(() => {
    if (showLoaderOverlay || isProcessing || !canRenderPreview) {
      return;
    }

    setRevealedAnimationToken(animationToken);
  }, [animationToken, canRenderPreview, isProcessing, showLoaderOverlay]);

  useEffect(() => {
    if (!showLoader && !canRenderPreview) {
      onRenderAnimationStateChangeRef.current?.(false);
    }
  }, [canRenderPreview, showLoader]);

  useEffect(() => {
    if (!isRenderMounted || !dimensions || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const settings = { cellSize, lineHeight, textColor, backgroundColor };
    const outputScale = Math.min(window.devicePixelRatio || 1, 2);

    const drawFrame = (visibleGlyphCount?: number) => {
      paintGlyphsToCanvas(canvas, renderGlyphs, dimensions, settings, {
        viewportWidth: viewportSize.width,
        viewportHeight: viewportSize.height,
        zoom,
        outputScale,
        visibleGlyphCount,
      });
    };

    let frameId = 0;
    let unlockFrameId = 0;

    if (!shouldAnimate || renderGlyphs.length <= 1) {
      drawFrame(renderGlyphs.length);
      animatedTokenRef.current = animationToken;
      unlockFrameId = window.requestAnimationFrame(() => {
        onRenderAnimationStateChangeRef.current?.(false);
      });
      return () => {
        window.cancelAnimationFrame(frameId);
        window.cancelAnimationFrame(unlockFrameId);
      };
    }

    const duration = PREVIEW_RENDER_MS;
    const glyphIntervalMs = duration / renderGlyphs.length;
    const start = performance.now();
    onRenderAnimationStateChangeRef.current?.(true);

    const tick = (now: number) => {
      const elapsed = Math.min(duration, now - start);
      const visibleGlyphCount = Math.min(
        renderGlyphs.length,
        Math.max(0, Math.round(elapsed / glyphIntervalMs))
      );
      drawFrame(visibleGlyphCount);

      if (elapsed < duration) {
        frameId = window.requestAnimationFrame(tick);
      } else {
        drawFrame(renderGlyphs.length);
        animatedTokenRef.current = animationToken;
        unlockFrameId = window.requestAnimationFrame(() => {
          onRenderAnimationStateChangeRef.current?.(false);
        });
      }
    };

    drawFrame(0);
    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(unlockFrameId);
    };
  }, [
    animationToken,
    backgroundColor,
    canRenderPreview,
    cellSize,
    dimensions,
    isRenderMounted,
    lineHeight,
    renderGlyphs,
    shouldAnimate,
    textColor,
    viewportSize.height,
    viewportSize.width,
    zoom,
  ]);

  return (
    <section className="vp-panel flex min-h-0 flex-1 flex-col p-4">
      <div className="mb-3">
        <p className="vp-kicker">PREVIEW</p>
      </div>
      {showLoader || isRenderMounted || showEmptyPoemLoader ? (
        <div
          ref={setViewportNode}
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[10px] border border-solid p-3"
          style={{ backgroundColor, borderColor: "var(--vp-row-border)" }}
        >
          {isRenderMounted ? (
            <div
              className="vp-preview-render-layer"
              data-visible={isLoaderFading || !showLoader ? "true" : "false"}
            >
              <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
            </div>
          ) : null}
          {showLoader ? (
            <div
              className="vp-preview-loader-layer"
              data-visible={showLoader ? "true" : "false"}
              data-fading={isLoaderFading ? "true" : "false"}
            >
              <div className="flex items-center justify-center">
                <DotmSquare11
                  ariaLabel="Processing uploaded image"
                  color={textColor}
                  dotShape="square"
                  size={34}
                  dotSize={4}
                  speed={PREVIEW_LOADER_SPEED}
                  pattern="full"
                />
              </div>
            </div>
          ) : null}
          {showEmptyPoemLoader ? (
            <div className="flex items-center justify-center">
              <DotmSquare11
                ariaLabel="Waiting for poem text"
                color={textColor}
                dotShape="square"
                size={34}
                dotSize={4}
                speed={PREVIEW_LOADER_SPEED}
                pattern="full"
              />
            </div>
          ) : null}
        </div>
      ) : statusMessage ? (
        <div
          className="flex min-h-0 flex-1 items-center justify-center rounded-[10px] border border-dashed px-6 text-center text-sm"
          style={{ backgroundColor, color: textColor, borderColor: "var(--vp-row-border)" }}
        >
          {statusMessage}
        </div>
      ) : null}
    </section>
  );
}
