import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, TrendingDown, Wallet } from "lucide-react";

import { TabBar, phoneShellClass } from "@/components/tab-bar";
import { useLocale } from "@/lib/i18n/locale";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: "Savings — Picky" },
      {
        name: "description",
        content: "Track how much Picky saves you on lunches every day, week and month.",
      },
    ],
  }),
  component: Savings,
});

type Period = "day" | "week" | "month";

type Bar = { labelKey: string; optimized: number; baseline: number };

const SERIES: Record<Period, Bar[]> = {
  day: [
    { labelKey: "savings.day.sun", optimized: 34, baseline: 52 },
    { labelKey: "savings.day.mon", optimized: 31, baseline: 47 },
    { labelKey: "savings.day.tue", optimized: 38, baseline: 55 },
    { labelKey: "savings.day.wed", optimized: 29, baseline: 45 },
    { labelKey: "savings.day.thu", optimized: 36, baseline: 58 },
  ],
  week: [
    { labelKey: "savings.week.threeAgo", optimized: 172, baseline: 255 },
    { labelKey: "savings.week.twoAgo", optimized: 165, baseline: 248 },
    { labelKey: "savings.week.last", optimized: 181, baseline: 262 },
    { labelKey: "savings.week.this", optimized: 168, baseline: 257 },
  ],
  month: [
    { labelKey: "savings.month.m3", optimized: 742, baseline: 1105 },
    { labelKey: "savings.month.m2", optimized: 716, baseline: 1084 },
    { labelKey: "savings.month.m1", optimized: 731, baseline: 1128 },
  ],
};


function SavingsRing({ saved, pct }: { saved: number; pct: number }) {
  const { t } = useLocale();
  const size = 188;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-primary/10"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-primary"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * progress) / 100}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("savings.ring.label")}
          </div>
          <div className="mt-1 font-display text-[34px] leading-none tracking-tight text-foreground">
            {t("lunches.savings.amount", { optimized: saved })}
          </div>
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            <TrendingDown className="h-3 w-3" strokeWidth={3} />
            {Math.round(pct)}%
          </div>
        </div>
      </div>
    </div>
  );
}

function Savings() {
  const { t } = useLocale();
  const [period, setPeriod] = useState<Period>("week");

  const bars = SERIES[period];
  const { saved, spent, baseline, pct } = useMemo(() => {
    const spent = bars.reduce((a, b) => a + b.optimized, 0);
    const baseline = bars.reduce((a, b) => a + b.baseline, 0);
    const saved = baseline - spent;
    return { saved, spent, baseline, pct: (saved / baseline) * 100 };
  }, [bars]);

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10 overflow-x-hidden">
      <div className={phoneShellClass}>
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className="flex-1 overflow-y-auto px-6 pt-10 pb-8">
          <div className="flex items-center gap-3">
            <Link
              to="/lunches"
              className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card shadow-soft border border-black/[0.04] text-foreground"
              aria-label={t("savings.backAria")}
            >
              <ArrowLeft className="h-4 w-4 rtl-flip" strokeWidth={2.2} />
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
              <Wallet className="h-3 w-3" strokeWidth={2.5} /> {t("savings.badge")}
            </div>
          </div>

          {/* Period switcher */}
          <div className="mt-5 grid grid-cols-3 gap-1 rounded-full bg-black/[0.05] p-1">
            {(["day", "week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-full py-1.5 text-[12px] font-semibold transition ${
                  period === p
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground"
                }`}
              >
                {t(`savings.period.${p}`)}
              </button>
            ))}
          </div>

          {/* Unified savings card: ring + spending chart */}
          <div className="mt-6 rounded-3xl border border-black/[0.06] bg-card p-5 shadow-card">
            <SavingsRing saved={saved} pct={pct} />

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-black/[0.03] px-3 py-2.5 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t("savings.stat.spent")}
                </div>
                <div className="mt-0.5 font-display text-[17px] leading-none text-foreground">
                  {t("lunches.savings.amount", { optimized: spent })}
                </div>
              </div>
              <div className="rounded-2xl bg-black/[0.03] px-3 py-2.5 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t("savings.stat.without")}
                </div>
                <div className="mt-0.5 font-display text-[17px] leading-none text-muted-foreground line-through">
                  {t("lunches.savings.amount", { optimized: baseline })}
                </div>
              </div>
            </div>

          </div>

        </main>

        <TabBar active="savings" />
      </div>
    </div>
  );
}
