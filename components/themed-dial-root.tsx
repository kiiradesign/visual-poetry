"use client";

import { DialRoot, type DialTheme } from "dialkit";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function resolveDialTheme(resolvedTheme: string | undefined): DialTheme {
  if (resolvedTheme === "dark") {
    return "dark";
  }
  if (resolvedTheme === "light") {
    return "light";
  }
  return "system";
}

export function ThemedDialRoot() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <DialRoot theme={mounted ? resolveDialTheme(resolvedTheme) : "system"} />;
}
