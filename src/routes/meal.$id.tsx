import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Clock,
  Tag,
  Truck,
  Receipt,
  Check,
  Sparkles,
} from "lucide-react";
import { getMealById, providers, type Provider } from "@/lib/meals";

export const Route = createFileRoute("/meal/$id")({
  head: ({ params }) => {
    const meal = getMealById(params.id);
    return {
      meta: [
        {
          title: meal
            ? `${meal.name} — Order on Fylo`
            : "Meal — Fylo",
        },
        {
          name: "description",
          content: meal
            ? `Compare delivery options for ${meal.name} from ${meal.restaurant} across HungerStation, Jahez, Keeta and Calo.`
            : "Compare delivery providers on Fylo.",
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
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-muted-foreground">
      Meal not found.{" "}
      <Link to="/" className="ml-2 text-primary underline">
        Back
      </Link>
    </div>
  ),
});

function MealDetail() {
  const { meal } = Route.useLoaderData();
  const enriched = providers
    .map((p) => {
      const itemTotal = Math.round(meal.basePrice * p.priceMultiplier);
      const service = Math.round(itemTotal * p.serviceFeePct);
      const total = itemTotal + p.deliveryFee + service;
      return { p, itemTotal, service, total };
    })
    .sort((a, b) => a.total - b.total);

  const cheapestTotal = enriched[0].total;
  const [selected, setSelected] = useState<string>(enriched[0].p.id);
  const chosen = enriched.find((e) => e.p.id === selected) ?? enriched[0];

  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10">
      <div className="mx-auto w-full max-w-[420px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative">
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        {/* Hero */}
        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img
              src={meal.image}
              alt={meal.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/10 to-transparent" />
          </div>
          <Link
            to="/"
            className="absolute left-5 top-5 md:top-12 grid h-10 w-10 place-items-center rounded-full bg-card/90 backdrop-blur shadow-soft text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          </Link>

          <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {meal.slot}
            </div>
            <h1 className="font-display text-[30px] leading-[1.05] tracking-tight mt-1">
              {meal.name}
            </h1>
            <div className="text-[13px] text-muted-foreground mt-1">
              from {meal.restaurant}
            </div>
          </div>
        </div>

        <main className="px-6 pb-40 pt-2">
          {/* AI summary */}
          <div className="rounded-3xl bg-card p-4 shadow-card border border-black/[0.03] flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="text-[13px] leading-snug">
              <span className="font-semibold">Fylo compared 4 apps</span> for
              this meal. Cheapest total is{" "}
              <span className="font-semibold text-primary">
                {cheapestTotal} SAR
              </span>
              .
            </div>
          </div>

          {/* Providers */}
          <h2 className="mt-7 font-display text-[24px] tracking-tight">
            Order from
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Same meal · live prices & fees
          </p>

          <div className="mt-4 space-y-3">
            {enriched.map(({ p, itemTotal, service, total }) => {
              const active = selected === p.id;
              const isCheapest = total === cheapestTotal;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  aria-pressed={active}
                  className={`w-full text-left rounded-3xl bg-card p-4 border transition shadow-card ${
                    active
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-black/[0.04] hover:border-black/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ProviderBadge p={p} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-[15px] truncate">
                          {p.name}
                        </div>
                        {isCheapest && (
                          <span className="text-[9px] font-bold tracking-wide uppercase rounded-full bg-primary text-primary-foreground px-2 py-0.5">
                            Best
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {p.etaMin}–{p.etaMax} min
                        {p.note && (
                          <>
                            <span className="mx-1">·</span>
                            <span className="text-foreground/70">
                              {p.note}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[18px] font-semibold leading-none">
                        {total}
                        <span className="text-[11px] font-medium text-muted-foreground ml-1">
                          SAR
                        </span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                        all-in
                      </div>
                    </div>
                  </div>

                  {active && (
                    <div className="mt-4 pt-4 border-t border-black/5 space-y-2 text-[13px]">
                      <FeeRow
                        icon={<Tag className="h-3.5 w-3.5" />}
                        label="Item price"
                        value={`${itemTotal} SAR`}
                      />
                      <FeeRow
                        icon={<Truck className="h-3.5 w-3.5" />}
                        label="Delivery fee"
                        value={
                          p.deliveryFee === 0
                            ? "Free"
                            : `${p.deliveryFee} SAR`
                        }
                        accent={p.deliveryFee === 0}
                      />
                      <FeeRow
                        icon={<Receipt className="h-3.5 w-3.5" />}
                        label={`Service fee · ${(p.serviceFeePct * 100).toFixed(0)}%`}
                        value={`${service} SAR`}
                      />
                      <div className="flex items-center justify-between pt-2 border-t border-black/5">
                        <span className="font-semibold">Total</span>
                        <span className="font-semibold text-primary">
                          {total} SAR
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </main>

        {/* CTA */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-4 bg-gradient-to-t from-background via-background to-transparent">
          <button className="w-full rounded-2xl bg-primary text-primary-foreground py-4 font-semibold text-[15px] shadow-soft flex items-center justify-center gap-2">
            <Check className="h-4 w-4" strokeWidth={3} />
            Order on {chosen.p.name} · {chosen.total} SAR
          </button>
        </div>
      </div>
    </div>
  );
}

function ProviderBadge({ p }: { p: Provider }) {
  return (
    <span
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${p.bg} text-white font-bold text-[13px] tracking-tight`}
    >
      {p.initials}
    </span>
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
