"use client";

import { Moon, Sun } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTheme } from "./theme-context";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid size-10 place-items-center rounded-xl border border-black/8 bg-white text-ink shadow-[0_10px_30px_rgba(0,0,0,0.04)]" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Light mode ga o'tish" : "Dark mode ga o'tish"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="grid size-10 place-items-center rounded-xl border border-black/8 bg-white text-ink shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition hover:border-black/20 hover:opacity-90 active:scale-95"
    >
      {isDark ? (
        <Sun className="size-4 text-amber-400 transition-transform duration-200 rotate-0 scale-100" />
      ) : (
        <Moon className="size-4 text-black/70 transition-transform duration-200 rotate-0 scale-100" />
      )}
    </button>
  );
}
