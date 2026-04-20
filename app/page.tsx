"use client";

import { useMemo, useState } from "react";
import { ColorControls } from "@/components/poetry/ColorControls";
import { ExportPanel } from "@/components/poetry/ExportPanel";
import { ImageUpload } from "@/components/poetry/ImageUpload";
import { PoemInput } from "@/components/poetry/PoemInput";
import { RenderPreview } from "@/components/poetry/RenderPreview";
import { exportPng } from "@/lib/render/exportPng";
import { getRenderDimensions } from "@/lib/render/layoutTextGrid";
import { preprocessImage } from "@/lib/render/preprocessImage";
import { BrightnessMap } from "@/lib/render/types";

const DEFAULT_POEM = `I write in weathered fragments,\nletters nesting under wings.\nEach line becomes a petal,\nand each petal learns to sing.`;

export default function HomePage() {
  const [poem, setPoem] = useState(DEFAULT_POEM);
  const [textColor, setTextColor] = useState("#111111");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [cellSize, setCellSize] = useState(10);
  const [exportScale, setExportScale] = useState(2);
  const [imageError, setImageError] = useState<string>();
  const [filename, setFilename] = useState<string>();
  const [brightnessMap, setBrightnessMap] = useState<BrightnessMap | null>(null);

  const canGenerate = poem.trim().length > 0 && brightnessMap !== null;
  const dimensions = useMemo(() => {
    if (!brightnessMap) {
      return null;
    }
    return getRenderDimensions(brightnessMap.width, brightnessMap.height, cellSize);
  }, [brightnessMap, cellSize]);

  async function handleImageSelection(file: File | null) {
    if (!file) {
      setBrightnessMap(null);
      setFilename(undefined);
      setImageError(undefined);
      return;
    }

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setImageError("Unsupported file type. Please upload a JPEG or PNG image.");
      return;
    }

    try {
      const nextBrightnessMap = await preprocessImage(file);
      setBrightnessMap(nextBrightnessMap);
      setFilename(file.name);
      setImageError(undefined);
    } catch {
      setBrightnessMap(null);
      setFilename(undefined);
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
        textColor,
        backgroundColor,
      },
      exportScale
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
        <div className="space-y-4">
          <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Visual Poetry</h1>
            <p className="mt-1 text-sm text-slate-600">
              Turn plain text poetry into image-guided type compositions.
            </p>
          </header>
          <PoemInput value={poem} onChange={setPoem} />
          <ImageUpload onSelect={handleImageSelection} filename={filename} error={imageError} />
          <ColorControls
            textColor={textColor}
            backgroundColor={backgroundColor}
            cellSize={cellSize}
            onTextColorChange={setTextColor}
            onBackgroundColorChange={setBackgroundColor}
            onCellSizeChange={setCellSize}
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
        />
      </div>
    </main>
  );
}
