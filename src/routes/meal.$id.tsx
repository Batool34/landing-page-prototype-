import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  MapPin,
  Clock,
  Sparkles,
  Pencil,
} from "lucide-react";
import { getMealById } from "@/lib/meals";

export const Route = createFileRoute("/meal/$id")({
  head: ({ params }) => {
    const meal = getMealById(params.id);
    return {
      meta: [
        {
          title: meal ? `${meal.name} — Confirm with Fylo` : "Meal — Fylo",
        },
        {
          name: "description",
          content: meal
            ? `Confirm delivery of ${meal.name} from ${meal.restaurant} with Fylo.`
            : "Confirm your Fylo lunch delivery.",
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

type Window = "12-1" | "1-3";
type DeliveryEntry = { address: string; window: Window };

const DEFAULT_ADDRESS = "Office · Olaya Tower, 12th Floor";
const DAY_NAMES: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

function MealDetail() {
  const { meal } = Route.useLoaderData();
  const navigate = useNavigate();

  const [day, setDay] = useState("Mon");
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [win, setWin] = useState<Window>("12-1");
  const [editing, setEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Hydrate from storage (per-day delivery details)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const d = localStorage.getItem("fylo:activeDay") ?? "Mon";
    setDay(d);
    try {
      const raw = localStorage.getItem("fylo:deliveryByDay");
      const map = raw ? (JSON.parse(raw) as Record<string, DeliveryEntry>) : {};
      const entry = map[d];
      if (entry) {
        setAddress(entry.address);
        setWin(entry.window);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persistDelivery = (next: DeliveryEntry) => {
    if (typeof window === "undefined") return;
    let map: Record<string, DeliveryEntry> = {};
    try {
      const raw = localStorage.getItem("fylo:deliveryByDay");
      if (raw) map = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    map[day] = next;
    localStorage.setItem("fylo:deliveryByDay", JSON.stringify(map));
  };

  const handleConfirm = () => {
    persistDelivery({ address, window: win });
    if (typeof window !== "undefined") {
      localStorage.setItem("fylo:lunchOrdered", meal.id);
      // Also persist to the per-day chosen map so the home reflects the pick.
      try {
        const raw = localStorage.getItem("fylo:lunchOrderedByDay");
        const m = raw ? JSON.parse(raw) : {};
        m[day] = meal.id;
        localStorage.setItem("fylo:lunchOrderedByDay", JSON.stringify(m));
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event("fylo:lunchOrdered"));
    }
    setConfirmed(true);
    setTimeout(() => navigate({ to: "/" }), 900);
  };

  const dayLabel = DAY_NAMES[day] ?? day;
  const winLabel = win === "12-1" ? "12:00 – 1:00 PM" : "1:00 – 3:00 PM";

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
              {dayLabel} · Lunch
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
          {/* Fylo delivers */}
          <div className="rounded-3xl bg-card p-4 shadow-card border border-black/[0.03] flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="text-[13px] leading-snug">
              <span className="font-semibold">Fylo delivers this to you.</span>{" "}
              No fees, no juggling apps — one price, one driver.
            </div>
          </div>

          {/* Address */}
          <h2 className="mt-7 font-display text-[22px] tracking-tight">
            Delivery details
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Saved just for {dayLabel}
          </p>

          <div className="mt-4 rounded-3xl bg-card border border-black/[0.04] shadow-card overflow-hidden">
            {/* Address row */}
            <div className="p-4 flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Deliver to
                </div>
                {editing ? (
                  <input
                    autoFocus
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onBlur={() => setEditing(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditing(false);
                    }}
                    className="mt-1 w-full bg-transparent border-b border-primary/40 focus:border-primary outline-none text-[14px] font-medium"
                  />
                ) : (
                  <div className="mt-0.5 text-[14px] font-medium truncate">
                    {address}
                  </div>
                )}
              </div>
              <button
                onClick={() => setEditing((v) => !v)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                aria-label="Edit address"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
            </div>

            <div className="h-px bg-black/[0.05] mx-4" />

            {/* Time window */}
            <div className="p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Arrival window
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <WindowOption
                  active={win === "12-1"}
                  label="12:00 – 1:00 PM"
                  sub="Early lunch"
                  onClick={() => setWin("12-1")}
                />
                <WindowOption
                  active={win === "1-3"}
                  label="1:00 – 3:00 PM"
                  sub="Standard lunch"
                  onClick={() => setWin("1-3")}
                />
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground leading-snug">
                Fylo aims to arrive within your window. You'll get a live ETA
                15 minutes before drop-off.
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 rounded-3xl bg-primary/5 border border-primary/15 p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-primary/80">
              Order summary
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[14px] font-medium">{meal.name}</span>
              <span className="text-[16px] font-semibold">
                {meal.basePrice}{" "}
                <span className="text-[11px] font-medium text-muted-foreground">
                  SAR
                </span>
              </span>
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground">
              {dayLabel} · {winLabel}
            </div>
          </div>
        </main>

        {/* CTA */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-4 bg-gradient-to-t from-background via-background to-transparent">
          <button
            onClick={handleConfirm}
            disabled={confirmed}
            className="w-full rounded-2xl bg-primary text-primary-foreground py-4 font-semibold text-[15px] shadow-soft flex items-center justify-center gap-2 disabled:opacity-80"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
            {confirmed ? "Order confirmed" : "Confirm Lunch with Fylo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WindowOption({
  active,
  label,
  sub,
  onClick,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`text-left rounded-2xl border px-3 py-3 transition ${
        active
          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
          : "border-black/[0.06] bg-card hover:border-black/15"
      }`}
    >
      <div
        className={`text-[13px] font-semibold ${
          active ? "text-primary" : "text-foreground"
        }`}
      >
        {label}
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </button>
  );
}
