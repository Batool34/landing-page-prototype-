import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Heart, ArrowRight } from "lucide-react";
import { TabBar } from "@/components/tab-bar";
import { mealPool } from "@/lib/meals";
import { useSavedMeals } from "@/hooks/use-saved-meals";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Meals — Picky" },
      { name: "description", content: "Meals you've bookmarked for later on Picky." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { ids, remove } = useSavedMeals();
  const items = ids
    .map((id) => mealPool.find((m) => m.id === id))
    .filter((m): m is (typeof mealPool)[number] => Boolean(m));

  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10 overflow-x-hidden">
      <div className="mx-auto w-full max-w-[420px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative">
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className="px-6 pt-10 pb-40">
          <Link
            to="/lunches"
            className="inline-grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft border border-black/[0.04] text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          </Link>
          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-[11px] font-medium text-blush-foreground">
            <Heart className="h-3 w-3" strokeWidth={2.5} /> Saved meals
          </div>
          <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight">
            Your saved <span className="italic text-primary">lunches.</span>
          </h1>

          {items.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-card p-7 shadow-card border border-black/[0.04] text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blush text-blush-foreground">
                <Heart className="h-5 w-5" strokeWidth={2.4} />
              </div>
              <h3 className="mt-4 font-display text-[20px] leading-tight tracking-tight">
                No saved meals yet
              </h3>
              <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
                Tap the heart on any lunch to save it here for later.
              </p>
              <Link
                to="/lunches"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] active:scale-[0.99] transition"
              >
                Browse lunches
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {items.map((m) => (
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
                      {m.slot} · {m.restaurant}
                    </div>
                    <div className="truncate font-semibold text-[14px]">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {m.kcal} kcal · {m.protein}g protein
                    </div>
                  </div>
                  <button
                    onClick={() => remove(m.id)}
                    aria-label="Remove from saved"
                    className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-primary shrink-0"
                  >
                    <Heart className="h-4 w-4 fill-primary" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>

        <TabBar active="profile" />
      </div>
    </div>
  );
}
