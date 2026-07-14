import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, History as HistoryIcon, Heart } from "lucide-react";
import { TabBar } from "@/components/tab-bar";
import { mealPool } from "@/lib/meals";
import { useSavedMeals } from "@/hooks/use-saved-meals";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Order History — Fylo" },
      { name: "description", content: "Your past Fylo lunches." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { isSaved, toggle } = useSavedMeals();
  const items = mealPool.slice(0, 6).map((m, i) => ({
    ...m,
    when: ["Yesterday", "Mon", "Sat", "Fri", "Thu", "Wed"][i],
    provider: ["HungerStation", "Jahez", "Keeta", "HungerStation", "Jahez", "Keeta"][i],
  }));

  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10">
      <div className="mx-auto w-full max-w-[420px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative">
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className="px-6 pt-10 pb-40">
          <Link
            to="/"
            className="inline-grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft border border-black/[0.04] text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          </Link>
          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-[11px] font-medium text-blush-foreground">
            <HistoryIcon className="h-3 w-3" strokeWidth={2.5} /> Order history
          </div>
          <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight">
            Your past <span className="italic text-primary">lunches.</span>
          </h1>

          <ul className="mt-6 space-y-3">
            {items.map((m) => {
              const saved = isSaved(m.id);
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-2xl bg-card border border-black/[0.04] p-3 shadow-card"
                >
                  <img
                    src={m.image}
                    alt={m.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {m.when} · {m.provider}
                    </div>
                    <div className="truncate font-semibold text-[14px]">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {m.restaurant}
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(m.id)}
                    aria-label={saved ? "Remove from saved" : "Save meal"}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        saved ? "fill-primary text-primary" : "text-foreground"
                      }`}
                      strokeWidth={2}
                    />
                  </button>
                  <div className="text-right shrink-0">
                    <div className="text-[14px] font-semibold text-primary">
                      {m.basePrice}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      SAR
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </main>

        <TabBar active="history" />
      </div>
    </div>
  );
}
