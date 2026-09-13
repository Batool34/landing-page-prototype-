import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { TabBar, phoneMainClass, phonePageWrapClass, phoneShellClass } from "@/components/tab-bar";
import { useLocale } from "@/lib/i18n/locale";
import { getMealName } from "@/lib/i18n/meals-ar";
import { getMealById } from "@/lib/meals";
import type { Meal } from "@/lib/meals";
import {
  countCompleteDays,
  dayFoodSubtotal,
  dayPricing,
  isDayOrderComplete,
  isWeekPaid,
  loadWeekOrders,
  markWeekPaid,
  weekBreakdown,
  WORK_DAYS,
  type DayOrder,
  type WorkDayId,
} from "@/lib/week-plan";
import { logEvent } from "@/lib/tracking";

const DAY_FULL_KEYS: Record<WorkDayId, string> = {
  Sun: "lunches.day.sun",
  Mon: "lunches.day.mon",
  Tue: "lunches.day.tue",
  Wed: "lunches.day.wed",
  Thu: "lunches.day.thu",
};

export const Route = createFileRoute("/week/checkout")({
  head: () => ({
    meta: [{ title: "Picky — Your week" }],
  }),
  component: WeekCheckout,
});

function WeekCheckout() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Partial<Record<WorkDayId, DayOrder>>>({});
  const [paid, setPaid] = useState(false);
  const [openDay, setOpenDay] = useState<WorkDayId | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    setOrders(loadWeekOrders());
    setPaid(isWeekPaid());
  }, []);

  const breakdown = weekBreakdown(orders);
  const complete = countCompleteDays(orders);
  const canPay = complete > 0 && !paid;

  const handlePay = () => {
    if (!canPay || paying) return;
    setPaying(true);
    markWeekPaid();
    logEvent("week_paid", { total: breakdown.total, days: complete });
    setTimeout(() => {
      setPaid(true);
      setPaying(false);
      navigate({ to: "/lunches" });
    }, 800);
  };

  return (
    <div className={phonePageWrapClass}>
      <div className={phoneShellClass}>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />
          <main className={`${phoneMainClass} pb-8 pt-8 px-6`}>
            <Link to="/lunches" className="text-[13px] text-primary font-medium">
              ← {t("week.back")}
            </Link>
            <h1 className="mt-4 font-display text-[28px] tracking-tight">{t("week.title")}</h1>

            <div className="mt-6 rounded-3xl bg-card border border-primary/20 ring-2 ring-primary/10 p-6 text-center shadow-card">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {t("week.totalLabel")}
              </div>
              <div className="mt-2 font-display text-[42px] leading-none text-primary">
                {breakdown.total}
                <span className="text-[16px] font-semibold ms-1">{t("common.sar")}</span>
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">
                {t("week.daysReady", { n: String(complete), total: String(WORK_DAYS.length) })}
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-card border border-black/[0.04] p-4 space-y-2 text-[13px]">
              <Row label={t("week.food")} value={`${breakdown.food} ${t("common.sar")}`} />
              <Row label={t("week.delivery")} value={`${breakdown.delivery} ${t("common.sar")}`} />
              <Row label={t("week.service")} value={`${breakdown.service} ${t("common.sar")}`} />
              <div className="border-t border-black/5 pt-2 flex justify-between font-semibold">
                <span>{t("week.grand")}</span>
                <span>{breakdown.total} {t("common.sar")}</span>
              </div>
            </div>

            <h2 className="mt-8 font-display text-[20px]">{t("week.byDay")}</h2>
            <div className="mt-3 space-y-2">
              {WORK_DAYS.map((day) => {
                const o = orders[day];
                const dayLabel = t(DAY_FULL_KEYS[day]);
                const expanded = openDay === day;
                const pricing = o ? dayPricing(o) : null;
                const completeDay = Boolean(o && isDayOrderComplete(o));
                return (
                  <div key={day} className="rounded-2xl bg-card border border-black/[0.04] overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-3 text-start"
                      onClick={() => setOpenDay(expanded ? null : day)}
                    >
                      <div className="flex items-center gap-2 min-w-0 shrink-0">
                        {completeDay ? (
                          <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={3} />
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-muted-foreground/40 shrink-0" />
                        )}
                        <span className="font-semibold text-[14px] w-[4.5rem]">{dayLabel}</span>
                      </div>
                      <div className="flex flex-1 justify-center min-w-0">
                        {o?.mainMealId ? (
                          <DayThumbStack order={o} locale={locale} />
                        ) : (
                          <span className="text-[11px] text-muted-foreground">{t("week.noMeal")}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[13px] font-semibold tabular-nums">
                          {completeDay && pricing ? `${pricing.dayTotal} ${t("common.sar")}` : "—"}
                        </span>
                        {expanded ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
                      </div>
                    </button>
                    {expanded && o && (
                      <div className="px-4 pb-3 text-[12px] text-muted-foreground space-y-1 border-t border-black/[0.04] pt-2">
                        <DayLine order={o} locale={locale} />
                        <div className="pt-1 text-foreground font-medium">
                          {t("week.foodLine", { n: String(pricing?.foodSubtotal ?? 0) })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {complete === 0 && (
              <p className="mt-6 text-[13px] text-muted-foreground leading-relaxed">{t("week.noDaysYet")}</p>
            )}
            {complete > 0 && complete < WORK_DAYS.length && (
              <p className="mt-6 text-[12px] text-muted-foreground leading-relaxed">{t("week.partialHint")}</p>
            )}

            {paid && (
              <p className="mt-4 text-[13px] text-primary font-medium">{t("week.alreadyPaid")}</p>
            )}

            <button
              type="button"
              disabled={!canPay || paying}
              onClick={handlePay}
              className="mt-8 w-full rounded-full bg-primary py-4 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] disabled:opacity-45"
            >
              {paying ? t("week.paying") : t("week.payCta")}
            </button>
          </main>
          <TabBar active="lunches" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

const MAX_EXTRA_THUMBS = 3;

function DayThumbStack({ order, locale }: { order: DayOrder; locale: string }) {
  const main = getMealById(order.mainMealId);
  if (!main) return null;
  const extras = order.extraMealIds
    .map((id) => getMealById(id))
    .filter((m): m is Meal => Boolean(m));
  const shown = extras.slice(0, MAX_EXTRA_THUMBS);
  const overflow = extras.length - shown.length;
  const mainAlt = getMealName(main.id, locale, main.name);

  return (
    <div className="flex items-center justify-center" aria-label={mainAlt}>
      <div className="flex items-center">
        <img
          src={main.image}
          alt={mainAlt}
          width={36}
          height={36}
          loading="lazy"
          className="relative z-[4] h-9 w-9 shrink-0 rounded-xl object-cover bg-secondary ring-2 ring-card shadow-sm"
        />
        {shown.map((m, i) => (
          <img
            key={m.id}
            src={m.image}
            alt={getMealName(m.id, locale, m.name)}
            width={28}
            height={28}
            loading="lazy"
            className="relative -ms-2 h-7 w-7 shrink-0 rounded-lg object-cover bg-secondary ring-2 ring-card"
            style={{ zIndex: 3 - i }}
          />
        ))}
        {overflow > 0 && (
          <span
            className="relative -ms-2 z-0 grid h-7 min-w-7 place-items-center rounded-lg bg-secondary px-1 text-[9px] font-bold text-muted-foreground ring-2 ring-card"
          >
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}

function DayLine({ order, locale }: { order: DayOrder; locale: string }) {
  const main = getMealById(order.mainMealId);
  const extras = order.extraMealIds.map((id) => getMealById(id)).filter(Boolean);
  return (
    <>
      <div>
        {main ? getMealName(main.id, locale, main.name) : "—"} · {main?.restaurant}
      </div>
      {extras.length > 0 && (
        <div>
          + {extras.map((m) => getMealName(m!.id, locale, m!.name)).join(", ")}
        </div>
      )}
    </>
  );
}
