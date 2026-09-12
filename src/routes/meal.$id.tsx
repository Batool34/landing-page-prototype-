import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock,
  Tag,
  Truck,
  Receipt,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { formatPrice } from "@/lib/format-values";
import { getMealById, hungerStationQuote } from "@/lib/meals";
import { logEvent } from "@/lib/tracking";
import { useLocale } from "@/lib/i18n/locale";
import { getMealName } from "@/lib/i18n/meals-ar";
import hungerstationLogo from "@/assets/providers/hungerstation.png";

function MealNotFound() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen grid place-items-center text-muted-foreground">
      {t("meal.notFound")}{" "}
      <Link to="/lunches" className="ms-2 text-primary underline">
        {t("common.back")}
      </Link>
    </div>
  );
}

function MealError() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen grid place-items-center text-muted-foreground">
      {t("meal.error")}{" "}
      <Link to="/lunches" className="ms-2 text-primary underline">
        {t("common.back")}
      </Link>
    </div>
  );
}

export const Route = createFileRoute("/meal/$id")({
  head: ({ params }) => {
    const meal = getMealById(params.id);
    return {
      meta: [
        {
          title: meal ? `${meal.name} — HungerStation` : "Meal — Picky",
        },
        {
          name: "description",
          content: meal
            ? `Order ${meal.name} from ${meal.restaurant} on HungerStation.`
            : "Order on HungerStation with Picky.",
        },
      ],
    };
  },
  loader: ({ params }) => {
    const meal = getMealById(params.id);
    if (!meal) throw notFound();
    return { meal };
  },
  component: MealDetail,
  notFoundComponent: () => <MealNotFound />,
  errorComponent: () => <MealError />,
});

function MealDetail() {
  const { id } = Route.useParams();
  const meal = getMealById(id);
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  if (!meal) return null;
  const mealName = getMealName(meal.id, locale, meal.name);

  const na = t("common.na");
  const quote = hungerStationQuote(meal);
  const money = (n: number | null) =>
    n == null ? na : `${n} ${t("common.sar")}`;

  const handleOrder = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fylo:lunchOrdered", meal.id);
      localStorage.setItem(
        "fylo:chosenProvider",
        JSON.stringify({
          mealId: meal.id,
          providerId: "hungerstation",
          providerName: "HungerStation",
          total: quote.total,
        }),
      );
      window.dispatchEvent(new Event("fylo:lunchOrdered"));
      if (meal.sourceUrl) {
        window.open(meal.sourceUrl, "_blank", "noopener,noreferrer");
      }
    }
    logEvent("provider_ordered", {
      mealId: meal.id,
      name: meal.name,
      providerId: "hungerstation",
      providerName: "HungerStation",
      total: quote.total,
    });
    navigate({ to: "/lunches" });
  };

  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10 overflow-x-hidden">
      <div className="mx-auto w-full max-w-[420px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative">
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img
              src={meal.image}
              alt={mealName}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/10 to-transparent" />
          </div>
          <Link
            to="/lunches"
            className="absolute start-5 top-5 md:top-12 grid h-10 w-10 place-items-center rounded-full bg-card/90 backdrop-blur shadow-soft text-foreground"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="h-4 w-4 rtl-flip" strokeWidth={2.2} />
          </Link>

          <div className="absolute bottom-0 inset-x-0 px-6 pb-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {meal.slot}
            </div>
            <h1 className="font-display text-[30px] leading-[1.05] tracking-tight mt-1">
              {mealName}
            </h1>
            <div className="text-[13px] text-muted-foreground mt-1">
              {t("meal.from", { restaurant: meal.restaurant })}
            </div>
          </div>
        </div>

        <main className="px-6 pb-40 pt-2">
          <div className="rounded-3xl bg-card p-4 shadow-card border border-black/[0.03] flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="text-[13px] leading-snug">
              {t("meal.hsPriceHint", {
                item: formatPrice(quote.itemTotal, na),
                total: quote.total == null ? na : String(quote.total),
              })}
            </div>
          </div>

          <h2 className="mt-7 font-display text-[24px] tracking-tight">
            {t("meal.orderFrom")}
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {t("meal.orderFromSub")}
          </p>

          <div className="mt-4 rounded-3xl bg-card p-4 border border-primary ring-2 ring-primary/20 shadow-card">
            <div className="flex items-center gap-3">
              <img
                src={hungerstationLogo}
                alt="HungerStation"
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-[11px] object-cover shadow-sm ring-1 ring-black/5"
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[15px]">HungerStation</div>
                <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {t("meal.eta", {
                    min: quote.etaMin,
                    max: quote.etaMax,
                  })}
                </div>
              </div>
              <div className="text-end shrink-0">
                <div className="text-[18px] font-semibold leading-none">
                  {quote.total == null ? na : quote.total}
                  {quote.total != null && (
                    <span className="text-[11px] font-medium text-muted-foreground ms-1">
                      {t("common.sar")}
                    </span>
                  )}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  {t("meal.allIn")}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-black/5 space-y-2 text-[13px]">
              <FeeRow
                icon={<Tag className="h-3.5 w-3.5" />}
                label={t("meal.itemPrice")}
                value={money(quote.itemTotal)}
              />
              <FeeRow
                icon={<Truck className="h-3.5 w-3.5" />}
                label={t("meal.deliveryFee")}
                value={
                  quote.deliveryFee === 0
                    ? t("meal.deliveryFree")
                    : `${quote.deliveryFee} ${t("common.sar")}`
                }
                accent={quote.deliveryFee === 0}
              />
              <FeeRow
                icon={<Receipt className="h-3.5 w-3.5" />}
                label={t("meal.serviceFee", {
                  pct: (quote.serviceFeePct * 100).toFixed(0),
                })}
                value={money(quote.service)}
              />
              <div className="flex items-center justify-between pt-2 border-t border-black/5">
                <span className="font-semibold">{t("meal.total")}</span>
                <span className="font-semibold text-primary">
                  {money(quote.total)}
                </span>
              </div>
            </div>
          </div>
        </main>

        <div className="absolute bottom-0 inset-x-0 px-6 pb-6 pt-4 bg-gradient-to-t from-background via-background to-transparent">
          <button
            type="button"
            onClick={handleOrder}
            className="w-full rounded-2xl bg-primary text-primary-foreground py-4 font-semibold text-[15px] shadow-soft flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
            {t("meal.orderCta", {
              provider: "HungerStation",
              total: quote.total == null ? na : quote.total,
            })}
            <ExternalLink className="h-4 w-4 opacity-80" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FeeRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon} {label}
      </span>
      <span
        className={`font-medium ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
