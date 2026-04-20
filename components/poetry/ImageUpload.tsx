import Image from "next/image";

type ImageUploadProps = {
  onSelect: (file: File | null) => void;
  filename?: string;
  previewUrl?: string;
  error?: string;
};

export function ImageUpload({ onSelect, filename, previewUrl, error }: ImageUploadProps) {
  return (
    <section className="rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm">
      <label htmlFor="image-upload" className="mb-2 block text-sm font-semibold">
        Reference image
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
        className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {filename ? `Selected: ${filename}` : "Upload PNG or JPEG to guide the composition."}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Uploads are currently compressed to viewport size and converted to monochrome detail mapping.
      </p>
      {previewUrl ? (
        <div className="mt-3 overflow-hidden rounded-md border border-solid border-border bg-muted p-2">
          <Image
            src={previewUrl}
            alt={filename ? `${filename} preview` : "Reference image preview"}
            width={320}
            height={112}
            unoptimized
            className="h-28 w-full rounded object-cover"
          />
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
