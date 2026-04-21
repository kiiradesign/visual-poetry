"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ColorControls } from "@/components/poetry/ColorControls";
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

type StoredImagePayload = {
  name: string;
  dataUrl: string;
};

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
  const [wordSpacing, setWordSpacing] = useState(2);
  const [detailStrength, setDetailStrength] = useState(0.65);
  const [exportScale, setExportScale] = useState(2);
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
    if (!brightnessMap || !dimensions || !poem.trim()) {
      return;
    }

    exportPng(
      poem,
      brightnessMap,
      dimensions,
      {
        cellSize,
        lineHeight,
        wordSpacing,
        detailStrength,
        textColor,
        backgroundColor,
      },
      exportScale
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
        <div className="space-y-4">
          <header className="rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl tracking-tight">
                  <span className="font-mono font-medium lowercase">visual</span>
                  <span className="ml-1 font-serif italic lowercase">poetry</span>
                </h1>
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

        <div className="space-y-4">
          <RenderPreview
            poem={poem}
            brightnessMap={brightnessMap}
            textColor={textColor}
            backgroundColor={backgroundColor}
            cellSize={cellSize}
            lineHeight={lineHeight}
            wordSpacing={wordSpacing}
            detailStrength={detailStrength}
            animationToken={animationToken}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <ColorControls
              textColor={textColor}
              backgroundColor={backgroundColor}
              cellSize={cellSize}
              detailStrength={detailStrength}
              lineHeight={lineHeight}
              wordSpacing={wordSpacing}
              onTextColorChange={handleTextColorChange}
              onBackgroundColorChange={handleBackgroundColorChange}
              onCellSizeChange={setCellSize}
              onDetailStrengthChange={setDetailStrength}
              onLineHeightChange={setLineHeight}
              onWordSpacingChange={setWordSpacing}
            />
            <div className="space-y-4">
              <ExportPanel
                scale={exportScale}
                canExport={canGenerate}
                onScaleChange={setExportScale}
                onExport={handleExport}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
