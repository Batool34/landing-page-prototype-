import { formatKcal, formatMacroGram } from "@/lib/format-values";
import { getMealName } from "@/lib/i18n/meals-ar";
import { useLocale } from "@/lib/i18n/locale";
import type { Meal } from "@/lib/meals";

export function MealNutritionDetails({ meal }: { meal: Meal }) {
  const { t, locale } = useLocale();
  const mealName = getMealName(meal.id, locale, meal.name);
  const na = t("common.na");
  const g = (n: number | null) => (n == null ? na : `${formatMacroGram(n, na)}g`);
  const rows = [
    { label: t("lunches.sheet.totalProtein"), value: g(meal.protein), bold: true },
    { label: t("lunches.sheet.netCarbs"), value: meal.carbs == null ? na : g(meal.carbs), bold: true },
    { label: t("lunches.sheet.fiber"), value: na, sub: true },
    { label: t("lunches.sheet.sugars"), value: na, sub: true },
    { label: t("lunches.sheet.totalFat"), value: g(meal.fat), bold: true },
    { label: t("lunches.sheet.saturated"), value: na, sub: true },
    { label: t("lunches.sheet.trans"), value: na, sub: true },
    { label: t("lunches.sheet.cholesterol"), value: na, bold: true },
    { label: t("lunches.sheet.sodium"), value: na, bold: true },
  ];
  const allergens = meal.allergens.length > 0 ? meal.allergens : [na];

  return (
    <div className="px-5 pb-2">
      <div className="text-[11px] uppercase tracking-[0.16em] text-primary font-semibold">
        {t("lunches.sheet.eyebrow")}
      </div>
      <div className="mt-3 rounded-2xl bg-secondary/50 p-4 border border-black/[0.03]">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { l: t("lunches.sheet.kcal"), v: formatKcal(meal.kcal, na), c: "text-primary" },
            { l: t("lunches.sheet.protein"), v: g(meal.protein), c: "text-foreground" },
            { l: t("lunches.sheet.carbs"), v: g(meal.carbs), c: "text-foreground" },
          ].map((s) => (
            <div key={s.l}>
              <div className={`font-display text-[22px] leading-none ${s.c}`}>{s.v}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 divide-y divide-border">
        {rows.map((r) => (
          <div key={r.label} className={`flex items-center justify-between py-2.5 ${r.sub ? "ps-3" : ""}`}>
            <span
              className={`text-[12px] ${
                r.sub ? "text-muted-foreground" : r.bold ? "font-semibold text-foreground" : "text-foreground"
              }`}
            >
              {r.label}
            </span>
            <span
              className={`text-[12px] tabular-nums ${
                r.sub ? "text-muted-foreground" : "font-semibold text-foreground"
              }`}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3">
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
