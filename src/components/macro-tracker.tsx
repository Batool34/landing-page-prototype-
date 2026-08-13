import { useEffect, useState } from "react";
import { Flame, Sparkles } from "lucide-react";
import { getMealById, type Meal } from "@/lib/meals";
import { useLocale } from "@/lib/i18n/locale";

const TARGET_KCAL = 2800;
const BURNED = 412;

/**
 * Compact layout for the calorie tracker.
 * "a" = one-line pill · "b" = slim ring card · "c" = bar-only card
 */
const VARIANT: "a" | "b" | "c" = "a";

function useOrderedLunch(): Meal | null {
  const [meal, setMeal] = useState<Meal | null>(null);
  useEffect(() => {
    const read = () => {
      if (typeof window === "undefined") return;
      const id = localStorage.getItem("fylo:lunchOrdered");
      setMeal(id ? getMealById(id) ?? null : null);
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "fylo:lunchOrdered") read();
    };
    const onCustom = () => read();
    window.addEventListener("storage", onStorage);
    window.addEventListener("fylo:lunchOrdered", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("fylo:lunchOrdered", onCustom);
    };
  }, []);
  return meal;
}

export function MacroTracker({ meal }: { meal?: Meal | null }) {
  const { t } = useLocale();
  const stored = useOrderedLunch();
  // Prop wins: the tracker mirrors the meal currently on screen
  // (top match today, or the meal the user picked instead).
  const lunch = meal !== undefined ? meal : stored;
  const lunchKcal = lunch?.kcal ?? 0;
  const remaining = Math.max(TARGET_KCAL - lunchKcal, 0);
  const pct = Math.min((lunchKcal / TARGET_KCAL) * 100, 100);

  if (VARIANT === "a") {
    return (
      <section className="mt-3 px-6">
        <div className="relative overflow-hidden rounded-2xl bg-card px-3.5 py-2.5 shadow-card border border-black/[0.03]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.14em] text-primary font-semibold leading-none">
                  {t("macro.title")}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground leading-none truncate">
                  {t("macro.lunchValue", { n: lunchKcal })} · {t("macro.burned", { n: BURNED })}
                </div>
              </div>
            </div>
            <div className="shrink-0 text-end">
              <div className="font-display text-[18px] leading-none tracking-tight text-primary tabular-nums">
                {remaining}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {t("macro.kcalLeft")}
              </div>
            </div>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-blush/70">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>
    );
  }

  if (VARIANT === "b") {
    const R = 40;
    const C = 2 * Math.PI * R;
    return (
      <section className="mt-3 px-6">
        <div className="relative overflow-hidden rounded-2xl bg-card p-3 shadow-card border border-black/[0.03] flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r={R} fill="none" stroke="oklch(0.94 0.02 20)" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="oklch(0.62 0.245 27)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * C} ${C}`}
                className="transition-[stroke-dasharray] duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-[13px] leading-none tabular-nums">{remaining}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 text-[11px] leading-tight">
            <div className="text-[10px] uppercase tracking-[0.14em] text-primary font-semibold">
              {t("macro.title")}
            </div>
            <div className="mt-1 flex items-center justify-between text-muted-foreground">
              <span>{t("macro.pickyLunch")}</span>
              <span className="font-medium text-foreground tabular-nums">
                {t("macro.lunchValue", { n: lunchKcal })}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="font-semibold text-foreground">{t("macro.dinner")}</span>
              <span className="font-semibold text-primary tabular-nums">
                {t("macro.dinnerValue", { n: remaining })}
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-3 px-6">
      <div className="relative overflow-hidden rounded-2xl bg-card px-3.5 py-3 shadow-card border border-black/[0.03]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-foreground">{t("macro.budget")}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Flame className="h-3 w-3 text-primary" strokeWidth={2.5} />
            {t("macro.burned", { n: BURNED })}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blush/70">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] tabular-nums">
          <span className="text-muted-foreground">
            {t("macro.target")} {t("macro.targetValue", { n: TARGET_KCAL })}
          </span>
          <span className="text-muted-foreground">{t("macro.lunchValue", { n: lunchKcal })}</span>
          <span className="font-semibold text-primary">{t("macro.dinnerValue", { n: remaining })}</span>
        </div>
      </div>
    </section>
  );
}
