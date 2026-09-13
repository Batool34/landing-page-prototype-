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
  dayPricing,
  getDayOrder,
  isDayOrderComplete,
  isSkippedDay,
  isWeekPaid,
  loadWeekOrders,
  markWeekPaid,
  weekBreakdown,
  WORK_DAYS,
  type DayOrder,
  type WeekDayEntry,
  type WorkDayId,
} from "@/lib/week-plan";
import { formatSarAmount } from "@/lib/format-values";
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
  const [orders, setOrders] = useState<Partial<Record<WorkDayId, WeekDayEntry>>>({});
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
                {formatSarAmount(breakdown.total)}
                <span className="text-[16px] font-semibold ms-1">{t("common.sar")}</span>
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">
                {t("week.daysReady", { n: String(complete), total: String(WORK_DAYS.length) })}
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-card border border-black/[0.04] p-4 space-y-2 text-[13px]">
              <Row label={t("week.food")} value={`${formatSarAmount(breakdown.food)} ${t("common.sar")}`} />
              <Row label={t("week.delivery")} value={`${formatSarAmount(breakdown.delivery)} ${t("common.sar")}`} />
              <Row label={t("week.service")} value={`${formatSarAmount(breakdown.service)} ${t("common.sar")}`} />
              <div className="border-t border-black/5 pt-2 flex justify-between font-semibold">
                <span>{t("week.grand")}</span>
                <span>{formatSarAmount(breakdown.total)} {t("common.sar")}</span>
              </div>
            </div>

            <h2 className="mt-8 font-display text-[20px]">{t("week.byDay")}</h2>
            <div className="mt-3 space-y-2">
              {WORK_DAYS.map((day) => {
                const entry = orders[day];
                const skipped = isSkippedDay(entry);
                const o = getDayOrder(entry);
                const dayLabel = t(DAY_FULL_KEYS[day]);
                const expanded = openDay === day;
                const pricing = o ? dayPricing(o) : null;
                const completeDay = Boolean(o && isDayOrderComplete(o));
                return (
                  <div
                    key={day}
                    className={`rounded-2xl border overflow-hidden ${
                      skipped
                        ? "bg-muted/45 border-black/[0.05] text-muted-foreground"
                        : "bg-card border-black/[0.04]"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start"
                      onClick={() => setOpenDay(expanded ? null : day)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {skipped ? (
                          <span className="h-4 w-4 shrink-0 rounded-full bg-muted-foreground/20" />
                        ) : completeDay ? (
                          <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={3} />
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-muted-foreground/40 shrink-0" />
                        )}
                        <span className={`font-semibold text-[14px] ${skipped ? "text-muted-foreground" : ""}`}>
                          {dayLabel}
                          {skipped && (
                            <span className="ms-1.5 text-[11px] font-medium uppercase tracking-wide">
                              · {t("week.skippedShort")}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[13px] font-semibold tabular-nums ${
                            skipped ? "text-muted-foreground" : ""
                          }`}
                        >
                          {skipped
                            ? `0 ${t("common.sar")}`
                            : completeDay && pricing
                              ? `${formatSarAmount(pricing.dayTotal)} ${t("common.sar")}`
                              : "—"}
                        </span>
                        {expanded ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
                      </div>
                    </button>
                    {expanded && (
                      <div className="px-4 pb-3 border-t border-black/[0.04] pt-3 space-y-3">
                        {skipped ? (
                          <p className="text-[12px] text-muted-foreground">{t("week.skippedDetail")}</p>
                        ) : !o?.mainMealId ? (
                          <p className="text-[12px] text-muted-foreground">{t("week.noMeal")}</p>
                        ) : (
                          <>
                            <DayThumbStack order={o} locale={locale} />
                            <div className="text-[12px] text-muted-foreground space-y-1">
                              <DayLine order={o} locale={locale} />
                              <div className="pt-1 text-foreground font-medium">
                                {t("week.foodLine", {
                                  n: formatSarAmount(pricing?.foodSubtotal ?? 0),
                                })}
                              </div>
                            </div>
                          </>
                        )}
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
    <div className="flex flex-wrap items-end gap-2" aria-label={mainAlt}>
      <div className="flex flex-col items-center gap-1">
        <img
          src={main.image}
          alt={mainAlt}
          width={48}
          height={48}
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-xl object-cover bg-secondary ring-1 ring-black/5"
        />
        <span className="max-w-[4.5rem] truncate text-[9px] text-muted-foreground">{mainAlt}</span>
      </div>
      {shown.map((m) => {
        const name = getMealName(m.id, locale, m.name);
        return (
          <div key={m.id} className="flex flex-col items-center gap-1">
            <img
              src={m.image}
              alt={name}
              width={40}
              height={40}
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded-lg object-cover bg-secondary ring-1 ring-black/5"
            />
            <span className="max-w-[4rem] truncate text-[9px] text-muted-foreground">{name}</span>
          </div>
        );
      })}
      {overflow > 0 && (
        <span className="mb-4 grid h-10 min-w-10 place-items-center rounded-lg bg-secondary px-1.5 text-[10px] font-semibold text-muted-foreground">
          +{overflow}
        </span>
      )}
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
