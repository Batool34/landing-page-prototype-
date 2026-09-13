import { useMemo } from "react";
import { Sparkles, Plus, Minus, Gift } from "lucide-react";
import { formatPrice } from "@/lib/format-values";
import { getMealName } from "@/lib/i18n/meals-ar";
import { useLocale } from "@/lib/i18n/locale";
import { getMealById, type Meal } from "@/lib/meals";
import {
  dayFoodSubtotal,
  gapToMinimum,
  getExtrasForRestaurant,
  MIN_FOOD_SAR,
  pickSurpriseExtras,
  type DayOrder,
} from "@/lib/week-plan";

export function MenuItemThumb({ meal, alt }: { meal: Meal; alt: string }) {
  return (
    <img
      src={meal.image}
      alt={alt}
      width={44}
      height={44}
      loading="lazy"
      decoding="async"
      className="h-11 w-11 shrink-0 rounded-xl object-cover bg-secondary ring-1 ring-black/5"
    />
  );
}

type Props = {
  main: Meal;
  extraIds: string[];
  surpriseIds: string[];
  onChange: (extraIds: string[], surpriseIds: string[]) => void;
  onConfirm: (order: DayOrder) => void;
  /** When true, parent renders confirm (e.g. fixed footer on extras full screen). */
  hideConfirmButton?: boolean;
};

export function DayExtrasSection({
  main,
  extraIds,
  surpriseIds,
  onChange,
  onConfirm,
  hideConfirmButton = false,
}: Props) {
  const { t, locale } = useLocale();

  const order: DayOrder = useMemo(
    () => ({
      mainMealId: main.id,
      extraMealIds: extraIds,
      surpriseExtraIds: surpriseIds,
    }),
    [main.id, extraIds, surpriseIds],
  );

  const food = dayFoodSubtotal(order);
  const gap = gapToMinimum(order);
  const canConfirm = gap === 0;

  const extras = useMemo(() => {
    const used = new Set([main.id, ...extraIds]);
    return getExtrasForRestaurant(main.restaurantSlug, used).slice(0, 24);
  }, [main, extraIds]);

  const toggleExtra = (id: string) => {
    const next = extraIds.includes(id) ? extraIds.filter((x) => x !== id) : [...extraIds, id];
    const nextSurprise = surpriseIds.filter((x) => x !== id);
    onChange(next, nextSurprise);
  };

  const applySurprise = () => {
    const manual = extraIds.filter((id) => !surpriseIds.includes(id));
    const base: DayOrder = {
      mainMealId: main.id,
      extraMealIds: manual,
      surpriseExtraIds: [],
    };
    const { ids } = pickSurpriseExtras(main, base);
    const merged = [...manual, ...ids.filter((id) => !manual.includes(id))];
    onChange(merged, ids);
  };

  const removeExtra = (id: string) => {
    onChange(
      extraIds.filter((x) => x !== id),
      surpriseIds.filter((x) => x !== id),
    );
  };

  return (
    <div className="mt-5 px-5 pb-5 border-t border-black/[0.04]">
      <div className="pt-5">
        <h3 className="font-display text-[18px] tracking-tight">{t("dayBuilder.title")}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{t("dayBuilder.subtitle")}</p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground">{t("dayBuilder.foodMinimum")}</span>
          <span className="font-semibold">
            {food} / {MIN_FOOD_SAR} {t("common.sar")}
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, (food / MIN_FOOD_SAR) * 100)}%` }}
          />
        </div>
        {gap > 0 && (
          <p className="mt-2 text-[12px] text-destructive">{t("dayBuilder.gap", { gap: String(gap) })}</p>
        )}
      </div>

      {extraIds.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("dayBuilder.added")}</div>
          {extraIds.map((id) => {
            const m = getMealById(id);
            if (!m) return null;
            const isSurprise = surpriseIds.includes(id);
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-2 rounded-xl bg-secondary/80 px-3 py-2"
              >
                <MenuItemThumb meal={m} alt={getMealName(id, locale, m.name)} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium truncate">{getMealName(id, locale, m.name)}</div>
                  {isSurprise && (
                    <span className="text-[10px] text-primary font-semibold">{t("dayBuilder.surpriseTag")}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[13px] font-semibold tabular-nums">
                    {formatPrice(m.basePrice, t("common.na"))}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExtra(id)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-black/10"
                    aria-label={t("dayBuilder.remove")}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={applySurprise}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3.5 text-start"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Gift className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[14px]">{t("dayBuilder.surpriseTitle")}</div>
          <div className="text-[11px] text-muted-foreground leading-snug">{t("dayBuilder.surpriseSub")}</div>
        </div>
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
      </button>

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("dayBuilder.fromMenu")}</div>
        <div className="mt-2 space-y-2">
          {extras.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">{t("dayBuilder.noExtras")}</p>
          ) : (
            extras.map((m) => {
              const on = extraIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleExtra(m.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition ${
                    on ? "border-primary bg-primary/5" : "border-black/[0.06] bg-card"
                  }`}
                >
                  <MenuItemThumb meal={m} alt={getMealName(m.id, locale, m.name)} />
                  <span className="min-w-0 flex-1 text-[13px] font-medium truncate">
                    {getMealName(m.id, locale, m.name)}
                  </span>
                  <span className="flex items-center gap-1 shrink-0 text-[13px] font-semibold">
                    {formatPrice(m.basePrice, t("common.na"))}
                    {on ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {!hideConfirmButton && (
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => onConfirm(order)}
          className="mt-6 w-full rounded-full bg-primary py-4 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] disabled:opacity-45 active:scale-[0.99] transition"
        >
          {canConfirm ? t("dayBuilder.confirm") : t("dayBuilder.confirmDisabled")}
        </button>
      )}
    </div>
  );
}
