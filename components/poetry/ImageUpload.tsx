import { ImageSquare } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  onSelect: (file: File | null) => void;
  filename?: string;
  previewUrl?: string;
  error?: string;
};

const PREVIEW_EASE = [0.23, 1, 0.32, 1] as const;

export function ImageUpload({ onSelect, filename, previewUrl, error }: ImageUploadProps) {
  return (
    <section className="vp-panel flex flex-col gap-3 px-4 py-3">
      <label htmlFor="image-upload" className="vp-kicker block">
        IMAGE
      </label>

      <div className="flex items-stretch gap-3">
        <label
          htmlFor="image-upload"
          className="vp-row flex w-fit max-w-[15rem] cursor-pointer flex-col items-start justify-center gap-4 self-auto p-4"
        >
          <span className="vp-action inline-flex h-9 shrink-0 items-center rounded-[8px] px-3 text-sm font-medium">
            Choose file
          </span>
          <span
            className={cn(
              "block max-w-full whitespace-normal break-words text-sm leading-snug",
              filename ? "vp-title" : "vp-copy"
            )}
          >
            {filename ?? "No file chosen"}
          </span>
        </label>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={!previewUrl}
              className="vp-row flex min-w-0 flex-1 items-center justify-center p-2 disabled:cursor-default"
              aria-label={previewUrl ? "Preview uploaded image" : "No uploaded image to preview"}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={previewUrl ?? "placeholder"}
                  initial={{ opacity: 0, transform: "scale(0.9)" }}
                  animate={{ opacity: 1, transform: "scale(1)" }}
                  exit={{ opacity: 0, transform: "scale(0.95)" }}
                  transition={{ duration: 0.22, ease: PREVIEW_EASE }}
                  className="relative h-full w-full overflow-hidden rounded-[6px] bg-black/10"
                >
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt={filename ? `${filename} preview` : "Uploaded reference preview"}
                      fill
                      unoptimized
                      className="object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageSquare className="size-8 opacity-70" weight="duotone" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </PopoverTrigger>
          {previewUrl ? (
            <PopoverContent align="end" sideOffset={8} className="w-[min(24rem,calc(100vw-2rem))] p-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-[6px] bg-black/10">
                <Image
                  src={previewUrl}
                  alt={filename ? `${filename} full preview` : "Uploaded reference full preview"}
                  fill
                  unoptimized
                  className="object-contain object-center"
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
