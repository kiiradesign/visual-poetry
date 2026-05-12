import { AnimatePresence, motion } from "framer-motion";

type ImageUploadProps = {
  onSelect: (file: File | null) => void;
  filename?: string;
  previewUrl?: string;
  error?: string;
};

const PREVIEW_EASE = [0.23, 1, 0.32, 1] as const;

export function ImageUpload({ onSelect, filename, previewUrl, error }: ImageUploadProps) {
  return (
    <section className="rounded-lg border border-solid border-border bg-card px-4 py-3 text-card-foreground shadow-sm">
      <div className="flex items-center gap-3">
        <label htmlFor="image-upload" className="text-base font-semibold">
          Reference image
        </label>
        <AnimatePresence initial={false} mode="wait">
          {previewUrl ? (
            <motion.div
              key={previewUrl}
              initial={{ opacity: 0, transform: "scale(0.9)" }}
              animate={{ opacity: 1, transform: "scale(1)" }}
              exit={{ opacity: 0, transform: "scale(0.95)" }}
              transition={{ duration: 0.22, ease: PREVIEW_EASE }}
              className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-solid border-border bg-muted"
              aria-hidden
            >
              <img
                src={previewUrl}
                alt=""
                className="block max-h-full max-w-full object-contain object-center"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <input
        id="image-upload"
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
        className="mt-2 block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground file:transition-colors file:duration-150 file:[transition-timing-function:var(--ease-out)] file:cursor-pointer hover:file:bg-secondary/80 active:file:scale-[0.97] motion-reduce:active:file:scale-100"
      />
      <p className="mt-1.5 truncate text-xs text-muted-foreground">
        {filename ? filename : "PNG or JPEG to guide the composition."}
      </p>
      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
