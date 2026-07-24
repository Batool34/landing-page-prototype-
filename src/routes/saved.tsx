import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { TabBar, phoneShellClass } from "@/components/tab-bar";
import { mealPool } from "@/lib/meals";
import { useSavedMeals } from "@/hooks/use-saved-meals";
import { useLocale } from "@/lib/i18n/locale";
import { getMealName } from "@/lib/i18n/meals-ar";

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
  const { t, locale } = useLocale();
  const { ids, remove } = useSavedMeals();
  const items = ids
    .map((id) => mealPool.find((m) => m.id === id))
    .filter((m): m is (typeof mealPool)[number] => Boolean(m));

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10 overflow-x-hidden">
      <div className={phoneShellClass}>
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className="flex-1 overflow-y-auto px-6 pt-10 pb-8">
          <Link
            to="/lunches"
            className="inline-grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft border border-black/[0.04] text-foreground"
          >
            <ArrowLeft className="h-4 w-4 rtl-flip" strokeWidth={2.2} />
          </Link>
          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-[11px] font-medium text-blush-foreground">
            {t("saved.badge")}
          </div>
          <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight">
            {t("saved.hero.before")}{" "}
            <span className="italic text-primary">{t("saved.hero.italic")}</span>
          </h1>

          {items.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-card p-7 shadow-card border border-black/[0.04] text-center">
              <h3 className="font-display text-[20px] leading-tight tracking-tight">
                {t("saved.empty.title")}
              </h3>
              <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
                {t("saved.empty.body")}
              </p>
              <Link
                to="/lunches"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] active:scale-[0.99] transition"
              >
                {t("saved.empty.cta")}
                <ArrowRight className="h-4 w-4 rtl-flip" strokeWidth={2.5} />
              </Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {items.map((m) => {
                const name = getMealName(m.id, locale, m.name);
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-2xl bg-card border border-black/[0.04] p-3 shadow-card"
                  >
                    <img
                      src={m.image}
                      alt={name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {m.slot} · {m.restaurant}
                      </div>
                      <div className="truncate font-semibold text-[14px]">{name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {t("saved.kcalProtein", { kcal: m.kcal, protein: m.protein })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(m.id)}
                      aria-label={t("lunches.removeSaved")}
                      className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground shrink-0"
                    >
                      <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </main>

        <TabBar active="profile" />
      </div>
    </div>
  );
}
