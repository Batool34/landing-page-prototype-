import { Heart, Sparkles, ThumbsDown, ThumbsUp, Meh } from "lucide-react";
import { formatKcal, formatPrice } from "@/lib/format-values";
import { CaloriePill } from "@/components/calorie-pill";
import { getMealName } from "@/lib/i18n/meals-ar";
import { useLocale } from "@/lib/i18n/locale";
import type { Meal } from "@/lib/meals";
import { logEvent } from "@/lib/tracking";
import { DayExtrasSection } from "@/components/day-extras-section";
import { MealNutritionDetails } from "@/components/meal-nutrition-details";
import type { DayOrder } from "@/lib/week-plan";

type Props = {
  meal: Meal;
  matchCount: number;
  isTopPick: boolean;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  vote?: "up" | "down" | "neutral";
  onVote: (vote: "up" | "down" | "neutral" | undefined) => void;
  extraIds: string[];
  surpriseIds: string[];
  onExtrasChange: (extraIds: string[], surpriseIds: string[]) => void;
  onConfirm: (order: DayOrder) => void;
};

export function DayMealPlanner({
  meal,
  matchCount,
  isTopPick,
  isSaved,
  onToggleSave,
  vote,
  onVote,
  extraIds,
  surpriseIds,
  onExtrasChange,
  onConfirm,
}: Props) {
  const { t, locale } = useLocale();
  const mealName = getMealName(meal.id, locale, meal.name);

  return (
    <section className="mt-6 px-6">
      <article
        key={meal.id}
        className="overflow-hidden rounded-3xl bg-card shadow-card border border-black/[0.03] animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="flex items-center justify-between border-b border-black/[0.04] bg-card/70 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <span className="text-[12px] font-semibold text-foreground">{t("lunches.aiStatus.label")}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="font-bold text-primary">{matchCount}</span>
            <span>{t("lunches.aiStatus.note", { count: matchCount })}</span>
          </div>
        </div>

        <div className="px-3 pt-3">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
            <img src={meal.image} alt={mealName} className="h-full w-full object-cover" loading="lazy" />
            <span className="absolute start-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-primary-foreground">
              {isTopPick ? t("lunches.tag.topMatch") : t("lunches.tag.yourPick")}
            </span>
            <button
              type="button"
              onClick={() => onToggleSave(meal.id)}
              className="absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 backdrop-blur shadow-soft"
              aria-label={isSaved ? t("lunches.removeSaved") : t("lunches.saveMeal")}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : "text-foreground"}`} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="p-5 pb-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{meal.slot}</div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-[22px] leading-tight tracking-tight">{mealName}</h3>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {t("lunches.from", { restaurant: meal.restaurant })}
              </div>
            </div>
            <div className="text-end shrink-0">
              <div className="text-[18px] font-semibold text-primary leading-none">
                {formatPrice(meal.basePrice, t("common.na"))}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                {t("common.sar")}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <CaloriePill
              label={t("lunches.more.kcal", { kcal: formatKcal(meal.kcal, t("common.na")) })}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-[11px] text-muted-foreground">{t("lunches.feedback.prompt")}</div>
            <div className="flex items-center gap-2">
              {(["down", "neutral", "up"] as const).map((v) => {
                const Icon = v === "down" ? ThumbsDown : v === "neutral" ? Meh : ThumbsUp;
                const active = vote === v;
                const activeCls =
                  v === "up"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-foreground bg-foreground text-background";
                return (
                  <button
                    key={v}
                    type="button"
                    aria-label={
                      v === "down"
                        ? t("lunches.feedback.thumbsDown")
                        : v === "neutral"
                          ? t("lunches.feedback.neutral")
                          : t("lunches.feedback.thumbsUp")
                    }
                    onClick={() => {
                      const next = active ? undefined : v;
                      onVote(next);
                      logEvent("meal_feedback", {
                        mealId: meal.id,
                        name: meal.name,
                        vote: next ?? "cleared",
                      });
                    }}
                    className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                      active ? activeCls : "border-black/10 bg-secondary text-foreground hover:border-black/25"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <MealNutritionDetails meal={meal} />

        <DayExtrasSection
          main={meal}
          extraIds={extraIds}
          surpriseIds={surpriseIds}
          onChange={onExtrasChange}
          onConfirm={onConfirm}
        />
      </article>
    </section>
  );
}
