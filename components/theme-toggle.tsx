"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ICON_EASE = [0.23, 1, 0.32, 1] as const;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span className="vp-row inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]" aria-hidden />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="vp-row vp-title relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[8px] transition-[background-color,transform,box-shadow] duration-150 [transition-timing-function:var(--ease-out)] active:scale-[0.94] motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "sun" : "moon"}
          className="absolute inline-flex items-center justify-center"
          initial={{ opacity: 0, transform: "scale(0.6) rotate(-45deg)" }}
          animate={{ opacity: 1, transform: "scale(1) rotate(0deg)" }}
          exit={{ opacity: 0, transform: "scale(0.6) rotate(45deg)" }}
          transition={{ duration: 0.2, ease: ICON_EASE }}
        >
          {isDark ? <Sun className="h-5 w-5" weight="duotone" /> : <Moon className="h-5 w-5" weight="duotone" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
