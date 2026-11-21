"use client";

import { Check, Globe } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "./i18n-context";
import { type Locale } from "./translations";

export function LanguageSwitcher() {
  const { locale, setLocale, locales } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const current = locales.find((item) => item.code === locale) || locales[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Tilni tanlash"
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-black/8 bg-white px-2.5 text-xs font-bold text-ink shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition hover:border-black/20 hover:opacity-90 active:scale-95"
      >
        <Globe className="size-3.5 text-black/50" />
        <span>{current.flag}</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-black/8 bg-white p-1 shadow-xl">
          {locales.map((item) => {
            const active = item.code === locale;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLocale(item.code as Locale);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
                  active ? "bg-ink text-white" : "text-ink hover:bg-surface-soft"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-[11px] font-bold opacity-70">{item.flag}</span>
                  <span>{item.label}</span>
                </span>
                {active ? <Check className="size-3.5" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
