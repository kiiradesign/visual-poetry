"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { DetailControls, VisualControls } from "@/components/poetry/ColorControls";
import { ExportPanel } from "@/components/poetry/ExportPanel";
import { ImageUpload } from "@/components/poetry/ImageUpload";
import { PoemInput } from "@/components/poetry/PoemInput";
import { RenderPreview } from "@/components/poetry/RenderPreview";
import { ThemeToggle } from "@/components/theme-toggle";
import { exportPng } from "@/lib/render/exportPng";
import { getRenderDimensions } from "@/lib/render/layoutTextGrid";
import { preprocessImage } from "@/lib/render/preprocessImage";
import { BrightnessMap } from "@/lib/render/types";

const DEFAULT_POEM = `fourth of july

turbulence and iridescent clouds

mid-air nirvana

read a book a day

draw gradient snakes and lilies

listen to pop music till your ears go numb

play with a cat during a thunderstorm

fix the leaky roof

don’t fry your brain

learn to build bridges.

cornflakes with soy milk for dinner

metamorphosis made me cry

the clouds swallowing the mountains

mist under the bridge

hundreds of unread emails

an outfit with everything in its right place

sleep deprived with a matcha latte and secondhand nicotine

an old lady's unsolicited useful advice

it is disrespectful to misspell someone’s name

negative net worth.

narcissist or alternative?

penguins in cape town

24th anniversary and halfway across the city

literally bipolar

go and touch some moss

ride the raging river waves on a surfboard

stranded on the other side

pack up and leave

this is how to disappear completely`;

const LIGHT_MODE_TEXT = "#2D2926"; // ink black
const LIGHT_MODE_BACKGROUND = "#F4F1EA"; // warm paper
const DARK_MODE_TEXT = "#E6EEF2"; // pale blue-white
const DARK_MODE_BACKGROUND = "#003153"; // Prussian blue

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
};

type PreviewViewport = { width: number; height: number };

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

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const [poem, setPoem] = useState(DEFAULT_POEM);
  const [textColor, setTextColor] = useState(LIGHT_MODE_TEXT);
  const [backgroundColor, setBackgroundColor] = useState(LIGHT_MODE_BACKGROUND);
  const [cellSize, setCellSize] = useState(10);
  const [lineHeight, setLineHeight] = useState(1.1);
  const [zoom, setZoom] = useState(1);
  const [exportScale, setExportScale] = useState(2);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>({ width: 0, height: 0 });
  const [imageError, setImageError] = useState<string>();
  const [filename, setFilename] = useState<string>();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>();
  const [brightnessMap, setBrightnessMap] = useState<BrightnessMap | null>(null);
  const [animationToken, setAnimationToken] = useState(0);
  const userCustomizedColorsRef = useRef(false);

  const canGenerate = poem.trim().length > 0 && brightnessMap !== null;
  const dimensions = useMemo(() => {
    if (!brightnessMap) {
      return null;
    }
    return getRenderDimensions(brightnessMap.width, brightnessMap.height, cellSize, lineHeight);
  }, [brightnessMap, cellSize, lineHeight]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    if (userCustomizedColorsRef.current) {
      return;
    }
    if (resolvedTheme === "dark") {
      setTextColor(DARK_MODE_TEXT);
      setBackgroundColor(DARK_MODE_BACKGROUND);
      return;
    }
    setTextColor(LIGHT_MODE_TEXT);
    setBackgroundColor(LIGHT_MODE_BACKGROUND);
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
    try {
      const storedPoem = window.localStorage.getItem(STORAGE_POEM_KEY);
      if (storedPoem !== null) {
        setPoem(storedPoem);
      }
    } catch {
      // Ignore storage read failures and keep default poem.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_POEM_KEY, poem);
    } catch {
      // Ignore storage write failures.
    }
  }, [poem]);

  useEffect(() => {
    try {
      const rawSettings = window.localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (!rawSettings) {
        return;
      }
      const parsed = JSON.parse(rawSettings) as Partial<StoredSettingsPayload>;
      if (typeof parsed.textColor === "string") {
        setTextColor(parsed.textColor);
        userCustomizedColorsRef.current = true;
      }
      if (typeof parsed.backgroundColor === "string") {
        setBackgroundColor(parsed.backgroundColor);
        userCustomizedColorsRef.current = true;
      }
      if (typeof parsed.cellSize === "number") {
        setCellSize(parsed.cellSize);
      }
      if (typeof parsed.lineHeight === "number") {
        setLineHeight(parsed.lineHeight);
      }
      if (typeof parsed.zoom === "number") {
        setZoom(parsed.zoom);
      }
      if (typeof parsed.exportScale === "number") {
        setExportScale(parsed.exportScale);
      }
    } catch {
      // Ignore malformed settings payload.
    }
  }, []);

  useEffect(() => {
    try {
      const payload: StoredSettingsPayload = {
        textColor,
        backgroundColor,
        cellSize,
        lineHeight,
        zoom,
        exportScale,
      };
      window.localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage write failures.
    }
  }, [backgroundColor, cellSize, exportScale, lineHeight, textColor, zoom]);

  useEffect(() => {
    async function restoreStoredImage() {
      try {
        const raw = window.localStorage.getItem(STORAGE_IMAGE_KEY);
        if (!raw) {
          return;
        }
        const parsed = JSON.parse(raw) as StoredImagePayload;
        if (!parsed?.dataUrl || !parsed?.name) {
          return;
        }
        const response = await fetch(parsed.dataUrl);
        const blob = await response.blob();
        const restoredFile = new File([blob], parsed.name, { type: blob.type || "image/png" });
        await handleImageSelection(restoredFile, false);
      } catch {
        window.localStorage.removeItem(STORAGE_IMAGE_KEY);
      }
    }

    void restoreStoredImage();
    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleImageSelection(file: File | null, persist: boolean = true) {
    if (!file) {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setBrightnessMap(null);
      setFilename(undefined);
      setImagePreviewUrl(undefined);
      setImageError(undefined);
      window.localStorage.removeItem(STORAGE_IMAGE_KEY);
      return;
    }

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setImageError("Unsupported file type. Please upload a JPEG or PNG image.");
      return;
    }

    try {
      const viewportMaxWidth = Math.max(600, Math.floor(window.innerWidth * 0.55));
      const viewportMaxHeight = Math.max(600, Math.floor(window.innerHeight * 0.8));
      const nextBrightnessMap = await preprocessImage(file, {
        maxWidth: viewportMaxWidth,
        maxHeight: viewportMaxHeight,
      });
      const nextPreviewUrl = URL.createObjectURL(file);
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setBrightnessMap(nextBrightnessMap);
      setFilename(file.name);
      setImagePreviewUrl(nextPreviewUrl);
      setImageError(undefined);
      setAnimationToken(Date.now());
      if (persist) {
        const dataUrl = await fileToDataUrl(file);
        const payload: StoredImagePayload = { name: file.name, dataUrl };
        window.localStorage.setItem(STORAGE_IMAGE_KEY, JSON.stringify(payload));
      }
    } catch {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setBrightnessMap(null);
      setFilename(undefined);
      setImagePreviewUrl(undefined);
      setImageError("Could not process the image. Try another file.");
      window.localStorage.removeItem(STORAGE_IMAGE_KEY);
    }
  }

  function handleExport() {
    if (!brightnessMap || !dimensions || !poem.trim() || !previewViewport.width || !previewViewport.height) {
      return;
    }

    exportPng(
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
      exportScale
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-background p-4 sm:p-6">
      <div className="mx-auto grid h-full w-full max-w-screen-2xl gap-4 lg:grid-cols-[minmax(280px,340px)_1fr_minmax(240px,280px)]">
        <div className="flex min-h-0 flex-col gap-4">
          <header className="rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="sr-only">Visual Poetry</h1>
                <Image
                  src="/branding/vp-logo.svg"
                  alt="Visual Poetry"
                  width={180}
                  height={28}
                  priority
                  className="h-7 w-auto select-none brightness-0 dark:invert"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  Turn plain text poetry into image-guided type compositions.
                </p>
              </div>
              <ThemeToggle />
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
            animationToken={animationToken}
            onViewportChange={setPreviewViewport}
          />
        </div>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          <DetailControls
            cellSize={cellSize}
            lineHeight={lineHeight}
            zoom={zoom}
            onCellSizeChange={setCellSize}
            onLineHeightChange={setLineHeight}
            onZoomChange={setZoom}
          />
          <VisualControls
            textColor={textColor}
            backgroundColor={backgroundColor}
            onTextColorChange={handleTextColorChange}
            onBackgroundColorChange={handleBackgroundColorChange}
          />
          <ExportPanel
            scale={exportScale}
            canExport={canGenerate}
            onScaleChange={setExportScale}
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
    <section className="flex flex-col gap-2 rounded-lg border border-solid border-border bg-card px-4 py-3 text-card-foreground shadow-sm">
      <h2 className="text-base font-semibold">About</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Visual Poetry turns plain text into image-guided type compositions — words become pixels, poems become texture.
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Made by{" "}
        <a
          href="https://kiiraetc.substack.com"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline-offset-4 transition-colors duration-150 [transition-timing-function:var(--ease-out)] hover:underline"
        >
          postcards from chaos
        </a>
        .
      </p>
    </section>
  );
}
