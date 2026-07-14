import { useEffect, useState } from "react";
import { Activity, Flame, Sparkles } from "lucide-react";
import { getMealById, type Meal } from "@/lib/meals";


const TARGET_KCAL = 1400;
const TARGET = { protein: 130, carbs: 150, fat: 50 };
// Baseline already consumed earlier in the day (breakfast/snacks from tracker)
const BASELINE = { kcal: 0, protein: 12, carbs: 28, fat: 6 };
const BURNED = 412;

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

export function MacroTracker() {
  const lunch = useOrderedLunch();
  const lunchKcal = lunch?.kcal ?? 0;
  const consumed = {
    kcal: BASELINE.kcal + lunchKcal,
    protein: BASELINE.protein + (lunch?.protein ?? 0),
    carbs: BASELINE.carbs + (lunch?.carbs ?? 0),
    fat: BASELINE.fat + (lunch?.fat ?? 0),
  };
  const remaining = Math.max(TARGET_KCAL - lunchKcal, 0);
  const ringPct = Math.min((lunchKcal / TARGET_KCAL) * 100, 100);

  // Ring geometry
  const R = 44;
  const C = 2 * Math.PI * R;
  const dash = (ringPct / 100) * C;

  return (
    <section className="mt-3 px-6">
      <div className="relative overflow-hidden rounded-3xl bg-card p-5 shadow-card border border-black/[0.03]">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-blush/60 blur-2xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-primary font-semibold">
                Auto Tracker
              </div>
              <div className="text-[10px] text-muted-foreground -mt-0.5">
                Synced 2 min ago · Apple Health
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-foreground">
            <Flame className="h-3 w-3 text-primary" strokeWidth={2.5} />
            {BURNED} burned
          </div>
        </div>

        {/* Ring + equation */}
        <div className="relative mt-4 flex items-center gap-4">
          <div className="relative h-[110px] w-[110px] shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="oklch(0.94 0.02 20)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="oklch(0.62 0.245 27)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${C}`}
                className="transition-[stroke-dasharray] duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-[24px] leading-none tracking-tight">
                {remaining}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                kcal left
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Today's budget
            </div>
            <div className="mt-1.5 space-y-1 text-[12px] leading-tight">
              <Row label="Target" value={`${TARGET_KCAL} kcal`} />
              <Row
                label="Fylo lunch"
                value={lunchKcal ? `− ${lunchKcal} kcal` : "− 0 kcal"}
                muted={!lunchKcal}
              />
              <div className="flex items-center justify-between pt-1.5 border-t border-black/5">
                <span className="text-[11px] font-semibold text-foreground">
                  Dinner
                </span>
                <span className="text-[13px] font-semibold text-primary">
                  {remaining} kcal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="relative mt-5 space-y-2.5">
          <MacroBar
            label="Protein"
            consumed={consumed.protein}
            target={TARGET.protein}
            tone="primary"
          />
          <MacroBar
            label="Carbs"
            consumed={consumed.carbs}
            target={TARGET.carbs}
            tone="blush"
          />
          <MacroBar
            label="Fats"
            consumed={consumed.fat}
            target={TARGET.fat}
            tone="primary-soft"
          />
        </div>

        {!lunch && (
          <div className="relative mt-4 flex items-center gap-1.5 rounded-2xl bg-blush/50 px-3 py-2 text-[11px] text-blush-foreground">
            <Activity className="h-3 w-3" strokeWidth={2.5} />
            Pick a lunch below — your macros update instantly.
          </div>
        )}
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-medium tabular-nums ${
          muted ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function MacroBar({
  label,
  consumed,
  target,
  tone,
}: {
  label: string;
  consumed: number;
  target: number;
  tone: "primary" | "blush" | "primary-soft";
}) {
  const pct = Math.min((consumed / target) * 100, 100);
  const fill =
    tone === "primary"
      ? "bg-primary"
      : tone === "blush"
        ? "bg-[oklch(0.86_0.06_20)]"
        : "bg-[oklch(0.75_0.16_25)]";
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          <span className="text-foreground font-semibold">{consumed}g</span> /{" "}
          {target}g
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full ${fill} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
