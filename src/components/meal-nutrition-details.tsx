import { formatKcal } from "@/lib/format-values";
import { getMealName } from "@/lib/i18n/meals-ar";
import { useLocale } from "@/lib/i18n/locale";
import type { Meal } from "@/lib/meals";
import { CaloriePill } from "@/components/calorie-pill";

export function MealNutritionDetails({ meal }: { meal: Meal }) {
  const { t, locale } = useLocale();
  const mealName = getMealName(meal.id, locale, meal.name);
  const na = t("common.na");
  const kcalLabel = t("lunches.more.kcal", {
    kcal: formatKcal(meal.kcal, na),
  });
  const allergens = meal.allergens.length > 0 ? meal.allergens : [na];

  return (
    <div className="px-5 pb-2">
      <div className="text-[11px] uppercase tracking-[0.16em] text-primary font-semibold">
        {t("lunches.sheet.eyebrow")}
      </div>
      <div className="mt-3 rounded-2xl bg-secondary/50 p-4 border border-black/[0.03] text-center">
        <div className="font-display text-[28px] leading-none text-primary tabular-nums">
          {formatKcal(meal.kcal, na)}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("lunches.sheet.kcal")}
        </div>
        <div className="mt-3 flex justify-center">
          <CaloriePill label={kcalLabel} />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{t("lunches.sheet.filtered")}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {allergens.map((a) => (
            <span key={a} className="rounded-full bg-blush px-2.5 py-0.5 text-[10px] font-medium text-blush-foreground">
              {a}
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only">{mealName}</p>
    </div>
  );
}
