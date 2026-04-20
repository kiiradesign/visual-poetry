import Image from "next/image";

type ImageUploadProps = {
  onSelect: (file: File | null) => void;
  filename?: string;
  previewUrl?: string;
  error?: string;
};

export function ImageUpload({ onSelect, filename, previewUrl, error }: ImageUploadProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor="image-upload" className="mb-2 block text-sm font-semibold text-slate-700">
        Reference image
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
      />
      <p className="mt-2 text-xs text-slate-500">
        {filename ? `Selected: ${filename}` : "Upload PNG or JPEG to guide the composition."}
      </p>
      {previewUrl ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
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
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </section>
  );
}
