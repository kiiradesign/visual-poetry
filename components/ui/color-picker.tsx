"use client";

import { cn } from "@/lib/utils";

type ColorPickerProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function normalizeHex(value: string): string {
  const cleaned = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const expanded = cleaned
      .split("")
      .map((ch) => `${ch}${ch}`)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }
  return "#000000";
}

export function ColorPicker({ id, label = "Color", value, onChange, className }: ColorPickerProps) {
  const normalizedValue = normalizeHex(value);

  return (
    <div
      className={cn(
        "inline-flex h-9 w-14 overflow-hidden rounded-md border border-input bg-background p-1 shadow-sm transition-colors hover:bg-muted/60 focus-within:ring-2 focus-within:ring-ring",
        className
      )}
    >
      <input
        id={id}
        type="color"
        aria-label={label}
        value={normalizedValue}
        onChange={(e) => onChange(normalizeHex(e.target.value))}
        className="h-full w-full cursor-pointer appearance-none rounded-[calc(var(--radius)-4px)] border-0 bg-transparent p-0 [&::-moz-color-swatch]:rounded-[calc(var(--radius)-4px)] [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-[calc(var(--radius)-4px)] [&::-webkit-color-swatch]:border-0"
      />
    </div>
  );
}
