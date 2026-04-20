"use client";

import { useMemo, type CSSProperties } from "react";

type ThemeRangeProps = {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  id?: string;
  "aria-label"?: string;
};

/**
 * Range input wired to Luma-style sliders: two-tone track (fill + remainder) via
 * --range-fill-pct, matching the theme reference (light: dark fill / gray rest / white pill thumb).
 */
export function ThemeRange({ min = 0, max = 100, step, value, onChange, className, id, "aria-label": ariaLabel }: ThemeRangeProps) {
  const lo = min;
  const hi = max;
  const pct = useMemo(() => {
    if (hi <= lo) return 0;
    return ((value - lo) / (hi - lo)) * 100;
  }, [value, lo, hi]);

  const style = {
    "--range-fill-pct": `${pct}%`,
  } as CSSProperties;

  return (
    <input
      id={id}
      aria-label={ariaLabel}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={["vp-range", className].filter(Boolean).join(" ")}
      style={style}
    />
  );
}
