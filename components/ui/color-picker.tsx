"use client";

import { CaretDown } from "@phosphor-icons/react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";

import { cn } from "@/lib/utils";

type ColorPickerProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

type ColorFormat = "hex" | "rgb" | "hsl";

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

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

function hexToRgb(hex: string): RGB {
  const clean = hex.replace(/^#/, "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function formatColor(hex: string, format: ColorFormat): string {
  if (format === "hex") return hex.replace(/^#/, "").toUpperCase();
  if (format === "rgb") {
    const { r, g, b } = hexToRgb(hex);
    return `${r}, ${g}, ${b}`;
  }
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  return `${h}, ${s}%, ${l}%`;
}

function parseColor(input: string, format: ColorFormat): string | null {
  const cleaned = input.trim();
  if (format === "hex") {
    const m = cleaned.replace(/^#/, "");
    if (/^[0-9a-fA-F]{6}$/.test(m)) return `#${m.toLowerCase()}`;
    if (/^[0-9a-fA-F]{3}$/.test(m)) {
      return `#${m.split("").map((c) => c + c).join("").toLowerCase()}`;
    }
    return null;
  }
  if (format === "rgb") {
    const m = cleaned.match(/^(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)$/);
    if (!m) return null;
    const r = Number(m[1]);
    const g = Number(m[2]);
    const b = Number(m[3]);
    if ([r, g, b].some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
    return rgbToHex({ r, g, b });
  }
  const m = cleaned.match(/^(\d+)°?\s*[,\s]\s*(\d+)%?\s*[,\s]\s*(\d+)%?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const s = Number(m[2]);
  const l = Number(m[3]);
  if (Number.isNaN(h) || h < 0 || h > 360) return null;
  if (Number.isNaN(s) || s < 0 || s > 100) return null;
  if (Number.isNaN(l) || l < 0 || l > 100) return null;
  return rgbToHex(hslToRgb({ h, s, l }));
}

function sanitizeInput(raw: string, format: ColorFormat): string {
  if (format === "hex") {
    return raw.replace(/^#/, "").replace(/[^0-9a-fA-F]/g, "").toUpperCase().slice(0, 6);
  }
  return raw.slice(0, 20);
}

export function ColorPicker({ id, label = "Color", value, onChange, className }: ColorPickerProps) {
  const normalizedValue = normalizeHex(value);
  const [format, setFormat] = useState<ColorFormat>("hex");
  const [draft, setDraft] = useState(() => formatColor(normalizedValue, "hex"));

  useEffect(() => {
    setDraft(formatColor(normalizedValue, format));
  }, [normalizedValue, format]);

  function commitDraft(raw: string) {
    const parsed = parseColor(raw, format);
    if (parsed) {
      onChange(parsed);
    } else {
      setDraft(formatColor(normalizedValue, format));
    }
  }

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          aria-label={label}
          className={cn(
            "relative inline-flex size-7 shrink-0 cursor-pointer overflow-hidden rounded-md shadow-sm transition-[transform,box-shadow] duration-150 [transition-timing-function:var(--ease-out)] active:scale-[0.94] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            className
          )}
          style={{ backgroundColor: normalizedValue }}
        />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className="vp-color-picker z-50 w-64 origin-(--radix-popover-content-transform-origin) rounded-xl border border-solid border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-150 [transition-timing-function:var(--ease-out)]"
        >
          <HexColorPicker
            color={normalizedValue}
            onChange={(next) => onChange(normalizeHex(next))}
          />
          <div className="mt-3 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-md border border-solid border-input bg-background pl-2.5 transition-[box-shadow] duration-150 [transition-timing-function:var(--ease-out)] focus-within:ring-1 focus-within:ring-ring">
              {format === "hex" ? (
                <span className="select-none font-mono text-sm text-muted-foreground">#</span>
              ) : null}
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(sanitizeInput(event.target.value, format))}
                onBlur={() => commitDraft(draft)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitDraft(draft);
                    (event.target as HTMLInputElement).blur();
                  }
                }}
                spellCheck={false}
                aria-label={`${format.toUpperCase()} value`}
                className="w-full min-w-0 flex-1 bg-transparent px-1 py-1.5 font-mono text-sm tabular-nums outline-none"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value as ColorFormat)}
                className="vp-field h-9 cursor-pointer appearance-none rounded-md pl-2.5 pr-7 text-sm font-medium"
                aria-label="Color format"
              >
                <option value="hex">Hex</option>
                <option value="rgb">RGB</option>
                <option value="hsl">HSL</option>
              </select>
              <CaretDown
                className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
                weight="bold"
              />
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
