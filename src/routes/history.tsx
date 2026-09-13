import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, History as HistoryIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TabBar, phoneMainClass, phonePageWrapClass, phoneShellClass } from "@/components/tab-bar";
import { formatSarAmount } from "@/lib/format-values";
import { useLocale } from "@/lib/i18n/locale";
import { getMealName } from "@/lib/i18n/meals-ar";
import { getMealById, type Meal } from "@/lib/meals";
import {
  dayPricing,
  getDayOrder,
  isDayOrderComplete,
  isWeekPaid,
  loadWeekOrders,
  WORK_DAYS,
  type DayOrder,
  type WeekDayEntry,
  type WorkDayId,
} from "@/lib/week-plan";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Order History — Picky" },
      { name: "description", content: "Your paid Picky lunches." },
    ],
  }),
  component: HistoryPage,
});

const DAY_FULL_KEYS: Record<WorkDayId, string> = {
  Sun: "lunches.day.sun",
  Mon: "lunches.day.mon",
  Tue: "lunches.day.tue",
  Wed: "lunches.day.wed",
  Thu: "lunches.day.thu",
};

const WORK_DAY_INDEX: Record<WorkDayId, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
};

function isPastWorkDay(day: WorkDayId, now: Date): boolean {
  const today = now.getDay();
  if (today === 5 || today === 6) return true;
  return WORK_DAY_INDEX[day] < today;
}

type PaidDayRow = {
  day: WorkDayId;
  order: DayOrder;
  main: Meal;
};

function collectPaidDays(orders: Partial<Record<WorkDayId, WeekDayEntry>>): PaidDayRow[] {
  const rows: PaidDayRow[] = [];
  for (const day of WORK_DAYS) {
    const order = getDayOrder(orders[day]);
    if (!order || !isDayOrderComplete(order)) continue;
    const main = getMealById(order.mainMealId);
    if (!main) continue;
    rows.push({ day, order, main });
  }
  return rows;
}

function OrderThumbs({ order }: { order: DayOrder }) {
  const extras = order.extraMealIds
    .map((id) => getMealById(id))
    .filter((m): m is Meal => Boolean(m))
    .slice(0, 2);
  const main = getMealById(order.mainMealId);
  if (!main) return null;
  const more = order.extraMealIds.length - extras.length;
  return (
    <div className="flex items-center shrink-0">
      <img
        src={main.image}
        alt=""
        className="h-12 w-12 rounded-xl object-cover ring-2 ring-card"
        width={48}
        height={48}
      />
      {extras.map((m) => (
        <img
          key={m.id}
          src={m.image}
          alt=""
          className="-ms-2 h-9 w-9 rounded-lg object-cover ring-2 ring-card"
          width={36}
          height={36}
        />
      ))}
      {more > 0 && (
        <span className="-ms-2 grid h-9 min-w-9 place-items-center rounded-lg bg-secondary px-1 text-[10px] font-semibold text-muted-foreground ring-2 ring-card">
          +{more}
        </span>
      )}
    </div>
  );
}

function OrderCard({ row, locale, t }: { row: PaidDayRow; locale: string; t: (k: string) => string }) {
  const name = getMealName(row.main.id, locale, row.main.name);
  const pricing = dayPricing(row.order);
  const extraCount = row.order.extraMealIds.length;
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-card border border-black/[0.04] p-3 shadow-card">
      <OrderThumbs order={row.order} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {t(DAY_FULL_KEYS[row.day])}
        </div>
        <div className="truncate font-semibold text-[14px]">{name}</div>
        <div className="text-[11px] text-muted-foreground truncate">{row.main.restaurant}</div>
        {extraCount > 0 && (
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {t("history.extrasCount", { n: String(extraCount) })}
          </div>
        )}
      </div>
      <div className="text-end shrink-0">
        <div className="text-[14px] font-semibold text-primary tabular-nums">
          {formatSarAmount(pricing.dayTotal)}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("common.sar")}</div>
      </div>
    </li>
  );
}

function HistoryPage() {
  const { t, locale } = useLocale();
  const [orders, setOrders] = useState<Partial<Record<WorkDayId, WeekDayEntry>>>({});
  const [paid, setPaid] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setOrders(loadWeekOrders());
      setPaid(isWeekPaid());
      setReady(true);
    };
    refresh();
    window.addEventListener("fylo:lunchOrdered", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("fylo:lunchOrdered", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const { completed, coming } = useMemo(() => {
    const now = new Date();
    const all = collectPaidDays(orders);
    const completed: PaidDayRow[] = [];
    const coming: PaidDayRow[] = [];
    for (const row of all) {
      if (isPastWorkDay(row.day, now)) completed.push(row);
      else coming.push(row);
    }
    return { completed, coming };
  }, [orders]);

  if (!ready) {
    return <div className={phonePageWrapClass} />;
  }

  return (
    <div className={phonePageWrapClass}>
      <div className={phoneShellClass}>
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className={`${phoneMainClass} px-6 pt-10 pb-8`}>
          <Link
            to="/lunches"
            className="inline-grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft border border-black/[0.04] text-foreground"
          >
            <ArrowLeft className="h-4 w-4 rtl-flip" strokeWidth={2.2} />
          </Link>
          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-[11px] font-medium text-blush-foreground">
            <HistoryIcon className="h-3 w-3" strokeWidth={2.5} /> {t("history.badge")}
          </div>
          <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight">
            {t("history.hero.before")}{" "}
            <span className="italic text-primary">{t("history.hero.italic")}</span>
          </h1>

          {!paid ? (
            <div className="mt-8 rounded-2xl border border-black/[0.06] bg-card p-5 text-center">
              <p className="text-[14px] text-muted-foreground leading-relaxed">{t("history.empty.unpaid")}</p>
              <Link
                to="/week/checkout"
                className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground"
              >
                {t("history.empty.checkoutCta")}
              </Link>
            </div>
          ) : completed.length === 0 && coming.length === 0 ? (
            <p className="mt-8 text-[14px] text-muted-foreground leading-relaxed">{t("history.empty.none")}</p>
          ) : (
            <div className="mt-6 space-y-8">
              {coming.length > 0 && (
                <section>
                  <h2 className="font-display text-[20px] tracking-tight">{t("history.section.coming")}</h2>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{t("history.section.comingHint")}</p>
                  <ul className="mt-3 space-y-3">
                    {coming.map((row) => (
                      <OrderCard key={row.day} row={row} locale={locale} t={t} />
                    ))}
                  </ul>
                </section>
              )}
              {completed.length > 0 && (
                <section>
                  <h2 className="font-display text-[20px] tracking-tight">{t("history.section.completed")}</h2>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{t("history.section.completedHint")}</p>
                  <ul className="mt-3 space-y-3">
                    {completed.map((row) => (
                      <OrderCard key={row.day} row={row} locale={locale} t={t} />
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </main>

        <TabBar active="history" />
      </div>
    </div>
  );
}
