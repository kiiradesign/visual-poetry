import { ImageSquare } from "@phosphor-icons/react";
import Image from "next/image";
import defaultReferenceImage from "@/branding/vp-logo.png";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  onSelect: (file: File | null) => void;
  filename?: string;
  previewUrl?: string;
  error?: string;
};

export function ImageUpload({ onSelect, filename, previewUrl, error }: ImageUploadProps) {
  const effectivePreviewUrl = previewUrl ?? defaultReferenceImage.src;
  const effectiveFilename = filename ?? "vp-logo.png";

  return (
    <section className="vp-panel flex flex-col gap-2 px-4 py-3">
      <label htmlFor="image-upload" className="vp-kicker block">
        IMAGE
      </label>

      <div className="grid grid-cols-[max-content_minmax(0,1fr)] items-stretch gap-3">
        <label
          htmlFor="image-upload"
          className="vp-row relative flex min-h-[6.25rem] w-fit shrink-0 cursor-pointer flex-col items-start justify-start self-auto px-4 pb-3 pt-4"
        >
          <span className="vp-action inline-flex h-9 shrink-0 items-center rounded-[8px] px-3 text-sm font-medium">
            Choose file
          </span>
          <span
            className={cn(
              "pointer-events-none absolute bottom-3 left-4 right-4 block truncate whitespace-nowrap text-sm leading-snug",
              effectiveFilename ? "vp-title" : "vp-copy"
            )}
            title={effectiveFilename}
          >
            {effectiveFilename}
          </span>
        </label>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={!effectivePreviewUrl}
              className="vp-row min-h-[6.25rem] min-w-0 w-full overflow-hidden disabled:cursor-default"
              aria-label="Preview reference image"
            >
              <div className="relative flex h-full min-h-[5.25rem] w-full items-center justify-center overflow-hidden rounded-[6px] bg-black/10">
                {effectivePreviewUrl ? (
                  <Image
                    src={effectivePreviewUrl}
                    alt={`${effectiveFilename} preview`}
                    fill
                    unoptimized
                    className="object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageSquare className="size-8 opacity-70" weight="duotone" />
                  </div>
                )}
              </div>
            </button>
          </PopoverTrigger>
          {effectivePreviewUrl ? (
            <PopoverContent align="end" sideOffset={8} className="w-[min(24rem,calc(100vw-2rem))] p-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-[6px] bg-black/10">
                <Image
                  src={effectivePreviewUrl}
                  alt={`${effectiveFilename} full preview`}
                  fill
                  unoptimized
                  className="object-cover object-center"
                />
              </div>
            </PopoverContent>
          ) : null}
        </Popover>
      </div>

      <input
        id="image-upload"
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
        className="sr-only"
      />
      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
