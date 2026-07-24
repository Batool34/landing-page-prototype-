import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale";
import type { Locale } from "@/lib/i18n/types";

/** Compact language control for in-app screens (light chrome). */
export function LocaleSwitch({ className = "" }: { className?: string }) {
  const { t, locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const pick = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  const code = locale === "ar" ? t("chrome.lang.arCode") : t("chrome.lang.enCode");

  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-card px-3 text-[12px] font-semibold text-foreground shadow-soft border border-black/[0.04] active:scale-95 transition"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={locale === "ar" ? t("chrome.lang.en") : t("chrome.lang.ar")}
      >
        <Globe className="h-4 w-4" strokeWidth={2.2} />
        <span>{code}</span>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute end-0 top-12 z-40 w-40 overflow-hidden rounded-2xl border border-black/[0.06] bg-card p-1 shadow-card"
        >
          <button
            type="button"
            role="option"
            aria-selected={locale === "en"}
            onClick={() => pick("en")}
            className={
              "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-[13px] " +
              (locale === "en" ? "bg-blush text-blush-foreground" : "text-foreground hover:bg-secondary")
            }
          >
            <span>{t("chrome.lang.en")}</span>
            <span className="text-muted-foreground text-[11px]">EN</span>
          </button>
          <button
            type="button"
            role="option"
            aria-selected={locale === "ar"}
            onClick={() => pick("ar")}
            className={
              "mt-0.5 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-[13px] " +
              (locale === "ar" ? "bg-blush text-blush-foreground" : "text-foreground hover:bg-secondary")
            }
          >
            <span>{t("chrome.lang.ar")}</span>
            <span className="text-muted-foreground text-[11px]">AR</span>
          </button>
        </div>
      )}
    </div>
  );
}
