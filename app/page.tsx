"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { DialTheme } from "dialkit";
import { useTheme } from "next-themes";
import Image from "next/image";
import defaultReferenceImage from "@/branding/vp-logo.png";
import { DetailControls, VisualControls } from "@/components/poetry/ColorControls";
import { ExportPanel } from "@/components/poetry/ExportPanel";
import { ImageUpload } from "@/components/poetry/ImageUpload";
import { PoemInput } from "@/components/poetry/PoemInput";
import { RenderPreview } from "@/components/poetry/RenderPreview";
import { ThemeToggle } from "@/components/theme-toggle";
import { exportImage, type ExportFormat } from "@/lib/render/exportPng";
import { getRenderDimensions } from "@/lib/render/layoutTextGrid";
import { preprocessImage } from "@/lib/render/preprocessImage";
import { BrightnessMap } from "@/lib/render/types";

const DEFAULT_POEM = "visual poetry";

const DEFAULT_RENDER_TEXT = "#2D2926"; // ink black
const DEFAULT_RENDER_BACKGROUND = "#F4F1EA"; // warm paper

const STORAGE_IMAGE_KEY = "visual-poetry-uploaded-image";
const STORAGE_POEM_KEY = "visual-poetry-poem";
const STORAGE_SETTINGS_KEY = "visual-poetry-settings";

type StoredImagePayload = {
  name: string;
  dataUrl: string;
};

type StoredSettingsPayload = {
  textColor: string;
  backgroundColor: string;
  cellSize: number;
  lineHeight: number;
  zoom: number;
  exportScale: number;
  exportFormat: ExportFormat;
};

type PreviewViewport = { width: number; height: number };

function isExportFormat(value: unknown): value is ExportFormat {
  return value === "png" || value === "jpg";
}

function revokeObjectUrlIfNeeded(url?: string) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image as data URL."));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}

async function assetToFile(assetUrl: string, filename: string): Promise<File> {
  const response = await fetch(assetUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

function resolveDialTheme(resolvedTheme: string | undefined): DialTheme {
  if (resolvedTheme === "dark") {
    return "dark";
  }
  if (resolvedTheme === "light") {
    return "light";
  }
  return "system";
}

function getThemeDefaultColors() {
  return {
    textColor: DEFAULT_RENDER_TEXT,
    backgroundColor: DEFAULT_RENDER_BACKGROUND,
  };
}

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [poem, setPoem] = useState(DEFAULT_POEM);
  const [textColor, setTextColor] = useState(DEFAULT_RENDER_TEXT);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_RENDER_BACKGROUND);
  const [cellSize, setCellSize] = useState(2.5);
  const [lineHeight, setLineHeight] = useState(0.8);
  const [zoom, setZoom] = useState(0.8);
  const [exportScale, setExportScale] = useState(2);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>({ width: 0, height: 0 });
  const [imageError, setImageError] = useState<string>();
  const [filename, setFilename] = useState<string>();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>();
  const [brightnessMap, setBrightnessMap] = useState<BrightnessMap | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(true);
  const [processingToken, setProcessingToken] = useState(1);
  const [animationToken, setAnimationToken] = useState(0);
  const [isRenderAnimating, setIsRenderAnimating] = useState(true);
  const userCustomizedColorsRef = useRef(false);
  const uploadRequestIdRef = useRef(0);

  const isThemeResolved = themeMounted && (resolvedTheme === "dark" || resolvedTheme === "light");
  const isAppReady = isThemeResolved && storageHydrated;
  const canGenerate = poem.trim().length > 0 && brightnessMap !== null;
  const dialTheme = themeMounted ? resolveDialTheme(resolvedTheme) : "system";
  const dimensions = useMemo(() => {
    if (!brightnessMap) {
      return null;
    }
    return getRenderDimensions(brightnessMap.width, brightnessMap.height, cellSize, lineHeight);
  }, [brightnessMap, cellSize, lineHeight]);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrlIfNeeded(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  useLayoutEffect(() => {
    if (userCustomizedColorsRef.current) {
      return;
    }
    const defaults = getThemeDefaultColors();
    setTextColor(defaults.textColor);
    setBackgroundColor(defaults.backgroundColor);
  }, [resolvedTheme]);

  function handleTextColorChange(value: string) {
    userCustomizedColorsRef.current = true;
    setTextColor(value);
  }

  function handleBackgroundColorChange(value: string) {
    userCustomizedColorsRef.current = true;
    setBackgroundColor(value);
  }

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }

    try {
      window.sessionStorage.setItem(STORAGE_POEM_KEY, poem);
    } catch {
      // Ignore storage write failures.
    }
  }, [poem, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }

    try {
      const payload: StoredSettingsPayload = {
        textColor,
        backgroundColor,
        cellSize,
        lineHeight,
        zoom,
        exportScale,
        exportFormat,
      };
      window.sessionStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage write failures.
    }
  }, [backgroundColor, cellSize, exportFormat, exportScale, lineHeight, storageHydrated, textColor, zoom]);

  async function loadBundledDefaultImage(): Promise<boolean> {
    try {
      const defaultFile = await assetToFile(defaultReferenceImage.src, "vp-logo.png");
      return await handleImageSelection(defaultFile, false, false);
    } catch {
      setImageError("Could not load the default image.");
      return false;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromSession() {
      try {
        const storedPoem = window.sessionStorage.getItem(STORAGE_POEM_KEY);
        if (storedPoem !== null) {
          setPoem(storedPoem);
        }

        const storedSettings = window.sessionStorage.getItem(STORAGE_SETTINGS_KEY);
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings) as Partial<StoredSettingsPayload>;

          if (typeof parsedSettings.textColor === "string") {
            setTextColor(parsedSettings.textColor);
          }
          if (typeof parsedSettings.backgroundColor === "string") {
            setBackgroundColor(parsedSettings.backgroundColor);
          }
          if (typeof parsedSettings.cellSize === "number") {
            setCellSize(parsedSettings.cellSize);
          }
          if (typeof parsedSettings.lineHeight === "number") {
            setLineHeight(parsedSettings.lineHeight);
          }
          if (typeof parsedSettings.zoom === "number") {
            setZoom(parsedSettings.zoom);
          }
          if (typeof parsedSettings.exportScale === "number") {
            setExportScale(parsedSettings.exportScale);
          }
          if (isExportFormat(parsedSettings.exportFormat)) {
            setExportFormat(parsedSettings.exportFormat);
          }

          if (
            parsedSettings.textColor !== undefined &&
            parsedSettings.backgroundColor !== undefined &&
            (parsedSettings.textColor !== DEFAULT_RENDER_TEXT ||
              parsedSettings.backgroundColor !== DEFAULT_RENDER_BACKGROUND)
          ) {
            userCustomizedColorsRef.current = true;
          }
        }

        const storedImage = window.sessionStorage.getItem(STORAGE_IMAGE_KEY);
        if (storedImage) {
          try {
            const parsedImage = JSON.parse(storedImage) as Partial<StoredImagePayload>;
            if (typeof parsedImage.dataUrl === "string" && typeof parsedImage.name === "string") {
              const restoredFile = await assetToFile(parsedImage.dataUrl, parsedImage.name);
              if (!cancelled) {
                const restored = await handleImageSelection(restoredFile, false, false);
                if (restored) {
                  return;
                }
              }
            }
          } catch {
            window.sessionStorage.removeItem(STORAGE_IMAGE_KEY);
          }
        }

        if (!cancelled) {
          await loadBundledDefaultImage();
        }
      } finally {
        if (!cancelled) {
          setStorageHydrated(true);
        }
      }
    }

    void hydrateFromSession();
    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleImageSelection(
    file: File | null,
    persist: boolean = true,
    fallbackToDefault: boolean = true
  ): Promise<boolean> {
    const requestId = uploadRequestIdRef.current + 1;
    uploadRequestIdRef.current = requestId;

    if (!file) {
      setIsProcessingImage(false);
      revokeObjectUrlIfNeeded(imagePreviewUrl);
      setBrightnessMap(null);
      setFilename(undefined);
      setImagePreviewUrl(undefined);
      setImageError(undefined);
      window.sessionStorage.removeItem(STORAGE_IMAGE_KEY);
      if (fallbackToDefault) {
        return loadBundledDefaultImage();
      }
      return false;
    }

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setIsProcessingImage(false);
      setIsRenderAnimating(false);
      setImageError("Unsupported file type. Please upload a JPEG or PNG image.");
      return false;
    }

    setProcessingToken(requestId);
    setIsProcessingImage(true);
    setIsRenderAnimating(true);
    setBrightnessMap(null);
    setFilename(file.name);
    setImageError(undefined);

    try {
      const viewportMaxWidth = Math.max(600, Math.floor(window.innerWidth * 0.55));
      const viewportMaxHeight = Math.max(600, Math.floor(window.innerHeight * 0.8));
      const nextBrightnessMap = await preprocessImage(file, {
        maxWidth: viewportMaxWidth,
        maxHeight: viewportMaxHeight,
      });

      if (requestId !== uploadRequestIdRef.current) {
        return false;
      }

      const nextPreviewUrl = URL.createObjectURL(file);
      revokeObjectUrlIfNeeded(imagePreviewUrl);
      setBrightnessMap(nextBrightnessMap);
      setImagePreviewUrl(nextPreviewUrl);
      setImageError(undefined);
      setAnimationToken(Date.now());
      if (persist) {
        const dataUrl = await fileToDataUrl(file);
        if (requestId !== uploadRequestIdRef.current) {
          return false;
        }
        const payload: StoredImagePayload = { name: file.name, dataUrl };
        window.sessionStorage.setItem(STORAGE_IMAGE_KEY, JSON.stringify(payload));
      }
      return true;
    } catch {
      if (requestId !== uploadRequestIdRef.current) {
        return false;
      }
      revokeObjectUrlIfNeeded(imagePreviewUrl);
      setBrightnessMap(null);
      setFilename(undefined);
      setImagePreviewUrl(undefined);
      setImageError("Could not process the image. Try another file.");
      window.sessionStorage.removeItem(STORAGE_IMAGE_KEY);
      if (fallbackToDefault) {
        return loadBundledDefaultImage();
      }
      return false;
    } finally {
      if (requestId === uploadRequestIdRef.current) {
        setIsProcessingImage(false);
      }
    }
  }

  function handleExport() {
    if (!brightnessMap || !dimensions || !poem.trim() || !previewViewport.width || !previewViewport.height) {
      return;
    }

    exportImage(
      poem,
      brightnessMap,
      dimensions,
      {
        cellSize,
        lineHeight,
        textColor,
        backgroundColor,
      },
      {
        width: previewViewport.width,
        height: previewViewport.height,
        zoom,
      },
      exportScale,
      exportFormat
    );
  }

  return (
    <main
      className="vp-shell h-screen overflow-hidden p-4 sm:p-5"
      style={!isAppReady ? { visibility: "hidden" } : undefined}
      aria-hidden={!isAppReady}
    >
      <div className="mx-auto grid h-full w-full max-w-screen-2xl gap-3 lg:grid-cols-[minmax(280px,340px)_1fr_minmax(240px,280px)]">
        <div className="flex min-h-0 flex-col gap-4">
          <header className="vp-panel p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h1 className="sr-only">Visual Poetry</h1>
                <div className="min-w-0 flex-1">
                  <Image
                    src="/branding/vp-logo.svg"
                    alt="Visual Poetry"
                    width={180}
                    height={28}
                    priority
                    className="h-9 w-auto max-w-full select-none brightness-0 dark:invert"
                  />
                </div>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="vp-copy min-w-0 text-sm">
                  Turn your poems into generative art.
                </p>
                <span className="vp-copy shrink-0 text-sm">v.1.0</span>
              </div>
            </div>
          </header>
          <PoemInput value={poem} onChange={setPoem} />
          <ImageUpload
            onSelect={handleImageSelection}
            filename={filename}
            previewUrl={imagePreviewUrl}
            error={imageError}
          />
        </div>

        <div className="flex min-h-0 flex-col">
          <RenderPreview
            poem={poem}
            brightnessMap={brightnessMap}
            textColor={textColor}
            backgroundColor={backgroundColor}
            cellSize={cellSize}
            lineHeight={lineHeight}
            zoom={zoom}
            isProcessing={isProcessingImage}
            processingToken={processingToken}
            animationToken={animationToken}
            onViewportChange={setPreviewViewport}
            onRenderAnimationStateChange={setIsRenderAnimating}
          />
        </div>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
          <DetailControls
            cellSize={cellSize}
            lineHeight={lineHeight}
            zoom={zoom}
            theme={dialTheme}
            disabled={isProcessingImage || isRenderAnimating}
            onCellSizeChange={setCellSize}
            onLineHeightChange={setLineHeight}
            onZoomChange={setZoom}
          />
          <VisualControls
            textColor={textColor}
            backgroundColor={backgroundColor}
            disabled={isProcessingImage || isRenderAnimating}
            onTextColorChange={handleTextColorChange}
            onBackgroundColorChange={handleBackgroundColorChange}
          />
          <ExportPanel
            scale={exportScale}
            format={exportFormat}
            canExport={canGenerate}
            isProcessing={isProcessingImage}
            onScaleChange={setExportScale}
            onFormatChange={setExportFormat}
            onExport={handleExport}
          />
          <AboutPanel />
        </div>
      </div>
    </main>
  );
}

function AboutPanel() {
  return (
    <section className="vp-panel flex min-h-0 flex-1 flex-col gap-2 px-4 py-3">
      <p className="vp-kicker">ABOUT</p>
      <p className="vp-copy text-sm leading-relaxed">
      Paste a poem. Upload a photo. The words take the shape of the image, turning the poem into an artwork.
      </p>
      <div className="mt-auto flex flex-col gap-2 pt-5">
        <div className="flex items-center justify-between gap-y-1">
          <a
            href="https://kiira.in"
            target="_blank"
            rel="noreferrer"
            className="vp-copy w-fit text-sm leading-relaxed transition-colors duration-150 [transition-timing-function:var(--ease-out)] hover:text-foreground"
          >
            Made by Keerthi
          </a>
          <a
            href="https://x.com/kiiradesign"
            target="_blank"
            rel="noreferrer"
            className="vp-copy w-fit text-sm leading-relaxed transition-colors duration-150 [transition-timing-function:var(--ease-out)] hover:text-foreground"
          >
            X (Twitter)
          </a>
        </div>
      </div>
    </section>
  );
}
