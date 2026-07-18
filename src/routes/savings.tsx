import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, PiggyBank, TrendingDown } from "lucide-react";
import { TabBar } from "@/components/tab-bar";

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

const weeks = [
  { label: "This week", optimized: 84, baseline: 140 },
  { label: "Last week", optimized: 91, baseline: 138 },
  { label: "2 weeks ago", optimized: 78, baseline: 145 },
  { label: "3 weeks ago", optimized: 88, baseline: 132 },
];

function Savings() {
  const totalSaved = weeks.reduce((a, w) => a + (w.baseline - w.optimized), 0);
  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10 overflow-x-hidden">
      <div className="mx-auto w-full max-w-[420px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative">
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className="px-6 pt-10 pb-40">
          <Link
            to="/lunches"
            className="inline-grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft border border-black/[0.04] text-foreground"
            aria-label="Back to lunches"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          </Link>

          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-[11px] font-medium text-blush-foreground">
            <PiggyBank className="h-3 w-3" strokeWidth={2.5} /> Money saved
          </div>
          <h1 className="mt-3 font-display text-[36px] leading-[1.05] tracking-tight">
            SAR {totalSaved}{" "}
            <span className="italic text-primary">saved this month.</span>
          </h1>

          <div className="mt-6 space-y-3">
            {weeks.map((w) => {
              const saved = w.baseline - w.optimized;
              const pct = (saved / w.baseline) * 100;
              return (
                <div
                  key={w.label}
                  className="glass-spend rounded-3xl p-5"
                >
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {w.label}
                      </div>
                      <div className="mt-1 font-display text-[26px] leading-none tracking-tight">
                        SAR {w.optimized}
                        <span className="ml-1 text-[12px] font-sans text-muted-foreground">
                          / SAR {w.baseline}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
                      <TrendingDown className="h-3 w-3" strokeWidth={3} />
                      SAR {saved}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
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
