import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, TrendingDown, Wallet } from "lucide-react";
import { TabBar, phoneShellClass } from "@/components/tab-bar";
import { useLocale } from "@/lib/i18n/locale";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: "Savings — Picky" },
      {
        name: "description",
        content: "Track how much Picky saves you on lunches every week and month.",
      },
    ],
  }),
  component: Savings,
});

const WEEK_KEYS = [
  { labelKey: "savings.week.this", optimized: 84, baseline: 140 },
  { labelKey: "savings.week.last", optimized: 91, baseline: 138 },
  { labelKey: "savings.week.twoAgo", optimized: 78, baseline: 145 },
  { labelKey: "savings.week.threeAgo", optimized: 88, baseline: 132 },
] as const;

function Savings() {
  const { t } = useLocale();
  const totalSaved = WEEK_KEYS.reduce((a, w) => a + (w.baseline - w.optimized), 0);
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

          <h1 className="mt-5 font-display text-[36px] leading-[1.05] tracking-tight">
            {t("savings.hero", { total: totalSaved })}{" "}
            <span className="italic text-primary">{t("savings.heroItalic")}</span>
          </h1>

          <div className="mt-6 space-y-3">
            {WEEK_KEYS.map((w) => {
              const saved = w.baseline - w.optimized;
              const pct = Math.min(100, (w.optimized / w.baseline) * 100);
              return (
                <div
                  key={w.labelKey}
                  className="rounded-3xl border border-black/[0.06] p-5 shadow-card"
                  style={{ backgroundColor: "#ffffff", color: "#1c1917" }}
                >
                  <div className="flex items-end justify-between">
                    <div>
                      <div
                        className="text-[11px] uppercase tracking-[0.16em]"
                        style={{ color: "#78716c" }}
                      >
                        {t(w.labelKey)}
                      </div>
                      <div className="mt-1 font-display text-[26px] leading-none tracking-tight">
                        {t("lunches.savings.amount", { optimized: w.optimized })}
                        <span
                          className="ms-1 text-[12px] font-sans"
                          style={{ color: "#78716c" }}
                        >
                          {t("lunches.savings.baseline", { baseline: w.baseline })}
                        </span>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-[12px] font-semibold"
                      style={{ color: "#e11d48" }}
                    >
                      <TrendingDown className="h-3 w-3" strokeWidth={3} />
                      {t("lunches.savings.saved", { saved })}
                    </span>
                  </div>
                  <div
                    className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: "#e11d48" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <TabBar active="savings" />
      </div>
    </div>
  );
}
