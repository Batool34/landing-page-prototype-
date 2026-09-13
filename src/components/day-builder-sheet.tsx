import { useMemo, useState } from "react";
import { Sparkles, X, Plus, Minus, Gift } from "lucide-react";
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

type Props = {
  main: Meal;
  initialExtras?: string[];
  initialSurprise?: string[];
  onClose: () => void;
  onConfirm: (order: DayOrder) => void;
};

export function DayBuilderSheet({
  main,
  initialExtras = [],
  initialSurprise = [],
  onClose,
  onConfirm,
}: Props) {
  const { t, locale } = useLocale();
  const [extraIds, setExtraIds] = useState<string[]>(initialExtras);
  const [surpriseIds, setSurpriseIds] = useState<string[]>(initialSurprise);

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
  const mainName = getMealName(main.id, locale, main.name);

  const extras = useMemo(() => {
    const used = new Set([main.id, ...extraIds]);
    return getExtrasForRestaurant(main.restaurantSlug, used).slice(0, 24);
  }, [main, extraIds]);

  const toggleExtra = (id: string) => {
    setExtraIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setSurpriseIds((prev) => prev.filter((x) => x !== id));
  };

  const applySurprise = () => {
    const base: DayOrder = {
      mainMealId: main.id,
      extraMealIds: extraIds.filter((id) => !surpriseIds.includes(id)),
      surpriseExtraIds: [],
    };
    const { ids } = pickSurpriseExtras(main, base);
    const manual = base.extraMealIds;
    const merged = [...manual, ...ids.filter((id) => !manual.includes(id))];
    setExtraIds(merged);
    setSurpriseIds(ids);
  };

  const removeExtra = (id: string) => {
    setExtraIds((prev) => prev.filter((x) => x !== id));
    setSurpriseIds((prev) => prev.filter((x) => x !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <div className="relative w-full max-w-[420px] max-h-[92dvh] overflow-y-auto rounded-t-[2rem] bg-background p-6 pb-8 shadow-[0_-20px_60px_-10px_oklch(0.2_0.02_20/0.25)] md:rounded-[2rem]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("dayBuilder.eyebrow")}
            </div>
            <h2 className="font-display text-[24px] tracking-tight mt-0.5">{t("dayBuilder.title")}</h2>
            <p className="text-[12px] text-muted-foreground mt-1">{t("dayBuilder.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-card border border-black/[0.04] p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("dayBuilder.main")}</div>
          <div className="mt-1 font-semibold text-[15px] leading-snug">{mainName}</div>
          <div className="text-[12px] text-muted-foreground">{main.restaurant}</div>
          <div className="mt-2 text-[14px] font-semibold text-primary">
            {formatPrice(main.basePrice, t("common.na"))} {t("common.sar")}
          </div>
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
            <p className="mt-2 text-[12px] text-destructive">
              {t("dayBuilder.gap", { gap: String(gap) })}
            </p>
          )}
        </div>

        {extraIds.length > 0 && (
          <div className="mt-5 space-y-2">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {t("dayBuilder.added")}
            </div>
            {extraIds.map((id) => {
              const m = getMealById(id);
              if (!m) return null;
              const isSurprise = surpriseIds.includes(id);
              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-secondary/80 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate">
                      {getMealName(id, locale, m.name)}
                    </div>
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
          className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3.5 text-start"
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

        <div className="mt-6">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {t("dayBuilder.fromMenu")}
          </div>
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
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
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-start transition ${
                      on ? "border-primary bg-primary/5" : "border-black/[0.06] bg-card"
                    }`}
                  >
                    <span className="text-[13px] font-medium truncate">{getMealName(m.id, locale, m.name)}</span>
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

        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => onConfirm(order)}
          className="mt-6 w-full rounded-full bg-primary py-4 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] disabled:opacity-45 active:scale-[0.99] transition"
        >
          {canConfirm ? t("dayBuilder.confirm") : t("dayBuilder.confirmDisabled")}
        </button>
      </div>
    </div>
  );
}
