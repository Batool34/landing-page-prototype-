import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { TabBar, phoneMainClass, phonePageWrapClass, phoneShellClass } from "@/components/tab-bar";
import { useLocale } from "@/lib/i18n/locale";
import { getMealName } from "@/lib/i18n/meals-ar";
import { getMealById } from "@/lib/meals";
import {
  countCompleteDays,
  dayFoodSubtotal,
  dayPricing,
  isWeekPaid,
  isWeekReadyForCheckout,
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

  const ready = isWeekReadyForCheckout(orders);
  const breakdown = weekBreakdown(orders);
  const complete = countCompleteDays(orders);

  const handlePay = () => {
    if (!ready || paying) return;
    setPaying(true);
    markWeekPaid();
    logEvent("week_paid", { total: breakdown.total, days: WORK_DAYS.length });
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
            <p className="mt-1 text-[13px] text-muted-foreground">{t("week.subtitle")}</p>

            <div className="mt-8 rounded-3xl bg-card border border-primary/20 ring-2 ring-primary/10 p-6 text-center shadow-card">
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
                const completeDay = Boolean(o && dayFoodSubtotal(o) >= 30);
                return (
                  <div key={day} className="rounded-2xl bg-card border border-black/[0.04] overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start"
                      onClick={() => setOpenDay(expanded ? null : day)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {completeDay ? (
                          <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={3} />
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-muted-foreground/40 shrink-0" />
                        )}
                        <span className="font-semibold text-[14px]">{dayLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[13px] font-semibold tabular-nums">
                          {pricing ? `${pricing.dayTotal} ${t("common.sar")}` : "—"}
                        </span>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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

            {!ready && (
              <p className="mt-6 text-[13px] text-destructive leading-relaxed">{t("week.notReady")}</p>
            )}

            {paid && (
              <p className="mt-4 text-[13px] text-primary font-medium">{t("week.alreadyPaid")}</p>
            )}

            <button
              type="button"
              disabled={!ready || paying || paid}
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
