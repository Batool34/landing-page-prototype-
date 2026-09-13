import { useMemo } from "react";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/format-values";
import { getMealName } from "@/lib/i18n/meals-ar";
import { useLocale } from "@/lib/i18n/locale";
import type { Meal } from "@/lib/meals";
import { DayExtrasSection } from "@/components/day-extras-section";
import { gapToMinimum, type DayOrder } from "@/lib/week-plan";

type Props = {
  meal: Meal;
  extraIds: string[];
  surpriseIds: string[];
  onChange: (extraIds: string[], surpriseIds: string[]) => void;
  onConfirm: (order: DayOrder) => void;
  onClose: () => void;
};

export function ExtrasFullScreen({
  meal,
  extraIds,
  surpriseIds,
  onChange,
  onConfirm,
  onClose,
}: Props) {
  const { t, locale } = useLocale();
  const mealName = getMealName(meal.id, locale, meal.name);

  const order: DayOrder = useMemo(
    () => ({
      mainMealId: meal.id,
      extraMealIds: extraIds,
      surpriseExtraIds: surpriseIds,
    }),
    [meal.id, extraIds, surpriseIds],
  );
  const canConfirm = gapToMinimum(order) === 0;

  const handleConfirm = () => {
    onConfirm(order);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-200">
      <header className="shrink-0 border-b border-black/[0.06] px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.16em] text-primary font-semibold">
              {t("extrasSheet.eyebrow")}
            </div>
            <h2 className="font-display text-[24px] tracking-tight leading-tight mt-0.5">
              {t("extrasSheet.title")}
            </h2>
            <p className="text-[12px] text-muted-foreground mt-1 truncate">
              {mealName} · {meal.restaurant}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-secondary/60 px-3 py-2.5">
          <img
            src={meal.image}
            alt=""
            className="h-12 w-12 rounded-xl object-cover ring-1 ring-black/5"
            width={48}
            height={48}
          />
          <div className="min-w-0 flex-1 text-[13px] font-medium truncate">{mealName}</div>
          <div className="text-[13px] font-semibold text-primary shrink-0">
            {formatPrice(meal.basePrice, t("common.na"))} {t("common.sar")}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <DayExtrasSection
          main={meal}
          extraIds={extraIds}
          surpriseIds={surpriseIds}
          onChange={onChange}
          onConfirm={handleConfirm}
          hideConfirmButton
        />
      </div>

      <div
        className="shrink-0 border-t border-black/[0.06] bg-background/95 backdrop-blur-xl px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <button
          type="button"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className="w-full rounded-full bg-primary py-4 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] disabled:opacity-45 active:scale-[0.99] transition"
        >
          {canConfirm ? t("dayBuilder.confirm") : t("dayBuilder.confirmDisabled")}
        </button>
      </div>
    </div>
  );
}
