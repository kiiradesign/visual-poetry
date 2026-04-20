"use client";

import { useEffect, useMemo, useState } from "react";
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

const DEFAULT_POEM = `friday the thirteenth.

time is not real. time is relative. time doesn't matter. but timing does.

the girl on the train cried herself to sleep.

where do you see yourself in 5 years? i wanna be a cool aunt. i wanna be a cat mom. i want my home to look like an art gallery. i wanna be a retired old lady that learns to crochet cute animals from her balcony on the 12th floor with the view of the lit up glass facade corporate slavery offices.

too early and too late at the same time but never on time.

100 clicked apply but it's actually 1078.

was that mid or was i mid?

it is just an insect. it is a loss-making machine. it is cheap labour. it is disposable.

why don't you do a creative job instead of a dumb tech job? if only you said these words 4 years ago, i wouldn't have subjected myself to academic masochism get myself a useless degree. it really is too late to drop out now.

I need my daily dose of delusion. horoscope. co-star. confirmation bias. queen of denial.

on days i write i don't text.

there is a new war starting every month. every two weeks.

secondhand smoke and the drinks i didn’t buy. nightmares about structural analysis. poppy seed haze and lucid dreams. zero protein diet and overdosed on carbs. hangover of guilt. sneezes that jump my soul out of my body.

drink a rose. eat a heart. roll a heart. burn a lung. puke your guts. dry your eyes. bleed. overbleed. tranexamic acid.

plane crash in at a place i could have gone. helicopter crash at a place i should have gone.

1 man in ladies coach. arguing with someone on his phone very loudly. TRAIN 39. 6 men in a ladies coach. 1 angry husband arguing with his wife in public. 5 men with red eyes, definitely not sober. TRAIN 40. TRAIN 40. TRAIN 40. do something ASAP.

cancel. book. cancel. book one way.

real parents. fake parents. fake cousins. made in china.

photos are decaying. moisture ruined the film. memories are fading. but the camera is back.

colonized. whitewashed. urbanized. gentrified.

sugar rush and an overwhelming amount of gratitude at an impossibly hard to find japanese restaurant.

grammarly can go to hell.

everyone is telling you to do everything and you do nothing. you need to cut through the noise and do something.

diversify. fund indie films and fund wars. sit with a crazy lady while tying your shoelaces. return someone’s book after 5 years. live in a traffic engineering nightmare. don’t read the news because AI wrote it.

tap scroll swipe type

see blink click draw

touch pierce bleed write.`;

export default function HomePage() {
  const [poem, setPoem] = useState(DEFAULT_POEM);
  const [textColor, setTextColor] = useState("#ffa8a8");
  const [backgroundColor, setBackgroundColor] = useState("#832a2a");
  const [cellSize, setCellSize] = useState(10);
  const [lineHeight, setLineHeight] = useState(1.1);
  const [wordSpacing, setWordSpacing] = useState(2);
  const [detailStrength, setDetailStrength] = useState(0.65);
  const [exportScale, setExportScale] = useState(2);
  const [imageError, setImageError] = useState<string>();
  const [filename, setFilename] = useState<string>();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>();
  const [brightnessMap, setBrightnessMap] = useState<BrightnessMap | null>(null);

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

  async function handleImageSelection(file: File | null) {
    if (!file) {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setBrightnessMap(null);
      setFilename(undefined);
      setImagePreviewUrl(undefined);
      setImageError(undefined);
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
    } catch {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setBrightnessMap(null);
      setFilename(undefined);
      setImagePreviewUrl(undefined);
      setImageError("Could not process the image. Try another file.");
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
                <h1 className="text-2xl font-semibold tracking-tight">Visual Poetry</h1>
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
          <ColorControls
            textColor={textColor}
            backgroundColor={backgroundColor}
            cellSize={cellSize}
            detailStrength={detailStrength}
            lineHeight={lineHeight}
            wordSpacing={wordSpacing}
            onTextColorChange={setTextColor}
            onBackgroundColorChange={setBackgroundColor}
            onCellSizeChange={setCellSize}
            onDetailStrengthChange={setDetailStrength}
            onLineHeightChange={setLineHeight}
            onWordSpacingChange={setWordSpacing}
          />
          <ExportPanel
            scale={exportScale}
            canExport={canGenerate}
            onScaleChange={setExportScale}
            onExport={handleExport}
          />
        </div>

        <RenderPreview
          poem={poem}
          brightnessMap={brightnessMap}
          textColor={textColor}
          backgroundColor={backgroundColor}
          cellSize={cellSize}
          lineHeight={lineHeight}
          wordSpacing={wordSpacing}
          detailStrength={detailStrength}
        />
      </div>
    </main>
  );
}
