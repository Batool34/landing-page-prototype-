import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Sparkles,
  X,
  Check,
  ArrowRight,
  RotateCcw,
  MapPin,
  Clock,
  Pencil,
  Navigation,

  ExternalLink,
  Loader2,
} from "lucide-react";

import pickyLogo from "@/assets/picky-logo.png";
import { formatKcal, formatMacroGram, formatPrice } from "@/lib/format-values";
import {
  getMealById,
  getMealsForDay,
  MEALS_PER_DAY_VIEW,
  type Meal,
} from "@/lib/meals";
import { TabBar, phoneMainClass, phonePageWrapClass, phoneShellClass } from "@/components/tab-bar";
import { MacroTracker } from "@/components/macro-tracker";
import { useSavedMeals } from "@/hooks/use-saved-meals";
import { syncLead, logEvent } from "@/lib/tracking";
import { useLocale } from "@/lib/i18n/locale";
import { getMealName } from "@/lib/i18n/meals-ar";
import { LocaleSwitch } from "@/components/locale-switch";
import { DayMealPlanner } from "@/components/day-meal-planner";
import {
  countCompleteDays,
  dayFoodSubtotal,
  isDayOrderComplete,
  isWorkDay,
  loadWeekOrders,
  saveWeekOrders,
  weekCheckoutTotal,
  type DayOrder,
  type WorkDayId,
} from "@/lib/week-plan";

export const Route = createFileRoute("/lunches")({
  head: () => ({
    meta: [
      { title: "Picky — AI-curated lunches, delivered." },
      {
        name: "description",
        content:
          "Picky is the first AI lunch decision app. It syncs with your fitness tracker and narrows the city to 5 perfect lunches a day.",
      },
      { property: "og:title", content: "Picky — AI-curated lunches, delivered." },
      {
        property: "og:description",
        content:
          "Skip the scroll. Picky picks 5 perfect lunches from your city every day, tuned to your body, budget and taste.",
      },
    ],
  }),
  component: Picky,
});

const days = [
  { d: "Sun", n: 16 },
  { d: "Mon", n: 17 },
  { d: "Tue", n: 18 },
  { d: "Wed", n: 19 },
  { d: "Thu", n: 20 },
];

function Picky() {
  const { t } = useLocale();
  const [ready, setReady] = useState(false);
  const [selectedDay, setSelectedDay] = useState("Sun");
  const [editingPlan, setEditingPlan] = useState(false);
  const [tier, setTier] = useState(0);
  const { isSaved, toggle: toggleSaved } = useSavedMeals();
  const [votes, setVotes] = useState<Record<string, "up" | "down" | "neutral" | undefined>>({});
  const [weekOrders, setWeekOrders] = useState<Partial<Record<WorkDayId, DayOrder>>>({});
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Always allow /lunches — do not bounce to the marketing landing page.
    setReady(true);
    setWeekOrders(loadWeekOrders());
  }, []);

  useEffect(() => {
    if (!isWorkDay(selectedDay)) setSelectedDay("Sun");
  }, [selectedDay]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fylo:activeDay", selectedDay);
    }
  }, [selectedDay]);

  // Full filtered pool so weekly lunch picks can reach every restaurant
  // (Al Baik / Shawarmer / Herfy included), not just the top 11.
  const allMeals = useMemo(
    () => getMealsForDay(selectedDay, MEALS_PER_DAY_VIEW),
    [selectedDay],
  );
  const [previewId, setPreviewId] = useState<string | null>(null);
  const workDay = isWorkDay(selectedDay) ? selectedDay : "Sun";
  const dayOrder = weekOrders[workDay];
  const dayComplete = Boolean(dayOrder && isDayOrderComplete(dayOrder));
  const mainForDay = dayOrder ? getMealById(dayOrder.mainMealId) ?? null : null;
  const chosenMeal = dayComplete ? mainForDay : null;
  const displayMeal = useMemo(() => {
    if (!allMeals.length) return null;
    if (previewId) return getMealById(previewId) ?? allMeals[0];
    if (dayOrder?.mainMealId) return getMealById(dayOrder.mainMealId) ?? allMeals[0];
    return allMeals[0];
  }, [allMeals, previewId, dayOrder?.mainMealId]);

  const isTopPick = Boolean(
    displayMeal && allMeals[0] && displayMeal.id === allMeals[0].id && !previewId,
  );

  const moreMeals = useMemo(
    () => allMeals.filter((m) => m.id !== displayMeal?.id),
    [allMeals, displayMeal?.id],
  );

  const plannerExtraIds =
    dayOrder?.mainMealId === displayMeal?.id ? dayOrder.extraMealIds : [];
  const plannerSurpriseIds =
    dayOrder?.mainMealId === displayMeal?.id ? dayOrder.surpriseExtraIds : [];

  const selectAlternateMain = (m: Meal) => {
    setPreviewId(m.id);
    const existing = weekOrders[workDay];
    const draft: DayOrder = {
      mainMealId: m.id,
      extraMealIds: existing?.mainMealId === m.id ? existing.extraMealIds : [],
      surpriseExtraIds: existing?.mainMealId === m.id ? existing.surpriseExtraIds : [],
    };
    const next = { ...weekOrders, [workDay]: draft };
    setWeekOrders(next);
    saveWeekOrders(next);
    setEditingPlan(true);
    logEvent("meal_main_selected", { day: workDay, mealId: m.id, name: m.name });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExtrasChange = (extraIds: string[], surpriseIds: string[]) => {
    if (!displayMeal) return;
    const next = {
      ...weekOrders,
      [workDay]: {
        mainMealId: displayMeal.id,
        extraMealIds: extraIds,
        surpriseExtraIds: surpriseIds,
      },
    };
    setWeekOrders(next);
    saveWeekOrders(next);
  };

  useEffect(() => {
    if (!displayMeal || dayComplete) return;
    const o = weekOrders[workDay];
    if (o?.mainMealId === displayMeal.id) return;
    const draft: DayOrder = {
      mainMealId: displayMeal.id,
      extraMealIds: [],
      surpriseExtraIds: [],
    };
    const next = { ...weekOrders, [workDay]: draft };
    setWeekOrders(next);
    saveWeekOrders(next);
  }, [displayMeal?.id, workDay, dayComplete]);

  const confirmDayOrder = (order: DayOrder) => {
    const next = { ...weekOrders, [workDay]: order };
    setWeekOrders(next);
    saveWeekOrders(next);
    setEditingPlan(false);
    setPreviewId(null);
    logEvent("day_order_confirmed", {
      day: workDay,
      mealId: order.mainMealId,
      extras: order.extraMealIds.length,
      food: dayFoodSubtotal(order),
    });
    syncLead();
  };

  const resetChoice = () => {
    const next = { ...weekOrders };
    delete next[workDay];
    setWeekOrders(next);
    saveWeekOrders(next);
    logEvent("meal_reset", { day: workDay });
    syncLead();
    setTier(2);
    setEditingPlan(false);
    setPreviewId(null);
  };

  const editDayOrder = () => {
    if (!dayOrder) return;
    setPreviewId(dayOrder.mainMealId);
    setEditingPlan(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Keep macro tracker in sync when switching days.
  useEffect(() => {
    if (typeof window === "undefined" || !ready) return;
    const o = weekOrders[workDay];
    if (o?.mainMealId && isDayOrderComplete(o)) {
      localStorage.setItem("fylo:lunchOrdered", o.mainMealId);
    } else localStorage.removeItem("fylo:lunchOrdered");
    window.dispatchEvent(new Event("fylo:lunchOrdered"));
  }, [workDay, weekOrders, ready]);

  if (!ready) return <div className="min-h-screen bg-[oklch(0.94_0.005_30)]" />;

  return (
    <div className={phonePageWrapClass}>
      {/* Phone frame */}
      <div className={phoneShellClass}>
        <div className="relative flex min-h-0 flex-1 flex-col">
          {/* notch (desktop only) */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

          <main className={`${phoneMainClass} pb-8 pt-6 md:pt-10`}>
            <Header />
            
            <Calendar
              selected={selectedDay}
              completeDays={weekOrders}
              onSelect={(d) => {
                setSelectedDay(d);
                setTier(0);
                setPreviewId(null);
                setEditingPlan(false);
              }}
            />
            <WeekPlanStrip orders={weekOrders} />
            <DeliverySlip day={selectedDay} />
            <MacroTracker
              meal={displayMeal ?? chosenMeal ?? null}
              confirmed={!!chosenMeal && !editingPlan}
            />

            {dayComplete && !editingPlan && chosenMeal && dayOrder ? (
              <SelectedLunch
                meal={chosenMeal}
                order={dayOrder}
                day={selectedDay}
                onReset={resetChoice}
                onEdit={editDayOrder}
              />
            ) : displayMeal ? (
              <DayMealPlanner
                meal={displayMeal}
                matchCount={allMeals.length}
                isTopPick={isTopPick}
                isSaved={isSaved(displayMeal.id)}
                onToggleSave={toggleSaved}
                vote={votes[displayMeal.id]}
                onVote={(v) => setVotes({ ...votes, [displayMeal.id]: v })}
                extraIds={plannerExtraIds}
                surpriseIds={plannerSurpriseIds}
                onExtrasChange={handleExtrasChange}
                onConfirm={confirmDayOrder}
              />
            ) : (
              <NoMoreMatches onReset={() => setTier(0)} />
            )}

            {displayMeal && (!dayComplete || editingPlan) && (
              <MoreOptions
                tier={tier}
                meals={moreMeals}
                onLoadMore={() => setTier((t) => t + 1)}
                onChoose={selectAlternateMain}
                isSaved={isSaved}
                onToggleSave={toggleSaved}
              />
            )}
          </main>

          <TabBar active="lunches" />

        </div>
      </div>
    </div>
  );
}

function WeekPlanStrip({ orders }: { orders: Partial<Record<WorkDayId, DayOrder>> }) {
  const { t } = useLocale();
  const complete = countCompleteDays(orders);
  if (complete === 0) return null;
  const total = weekCheckoutTotal(orders);
  return (
    <Link
      to="/week/checkout"
      className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3"
    >
      <span className="text-[12px] font-medium leading-snug">
        {t("lunches.weekStrip", { n: String(complete), total: String(total) })}
      </span>
      <span className="text-[12px] font-semibold text-primary shrink-0">{t("lunches.weekStripCta")} →</span>
    </Link>
  );
}

type DeliveryWindow = "12-1" | "1-3";
type DeliveryEntry = {
  address: string;
  window: DeliveryWindow;
  lat?: number;
  lng?: number;
};
const DEFAULT_ADDRESS_EN = "Office · KAFD, 12F";
const DAY_FULL_KEYS: Record<string, string> = {
  Mon: "lunches.day.mon",
  Tue: "lunches.day.tue",
  Wed: "lunches.day.wed",
  Thu: "lunches.day.thu",
  Fri: "lunches.day.fri",
  Sat: "lunches.day.sat",
  Sun: "lunches.day.sun",
};
const DAY_SHORT_KEYS: Record<string, string> = {
  Mon: "lunches.dayShort.mon",
  Tue: "lunches.dayShort.tue",
  Wed: "lunches.dayShort.wed",
  Thu: "lunches.dayShort.thu",
  Fri: "lunches.dayShort.fri",
  Sat: "lunches.dayShort.sat",
  Sun: "lunches.dayShort.sun",
};

function formatPlaceLabel(data: {
  display_name?: string;
  address?: Record<string, string>;
}): string {
  const a = data.address ?? {};
  const road = a.road || a.pedestrian || a.neighbourhood || a.suburb;
  const area = a.suburb || a.neighbourhood || a.quarter || a.city_district;
  const city = a.city || a.town || a.village || a.state;
  const building = a.building || a.amenity || a.office;
  const parts = [building, road, area, city].filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, 3).join(" · ");
  if (parts.length === 1) return parts[0]!;
  const raw = data.display_name?.split(",").slice(0, 3).join(" · ").trim();
  return raw || DEFAULT_ADDRESS_EN;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // Browser-friendly reverse geocode (no API key). Falls back to a short coord label.
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as {
        locality?: string;
        city?: string;
        principalSubdivision?: string;
        localityInfo?: { informative?: Array<{ name?: string }> };
      };
      const informative = data.localityInfo?.informative?.map((x) => x.name).filter(Boolean) ?? [];
      const neighborhood = informative[0];
      const parts = [neighborhood, data.locality || data.city, data.principalSubdivision].filter(
        (p, i, arr) => Boolean(p) && arr.indexOf(p) === i,
      );
      if (parts.length) return parts.slice(0, 3).join(" · ");
    }
  } catch {
    /* try OSM next */
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = (await res.json()) as {
        display_name?: string;
        address?: Record<string, string>;
      };
      return formatPlaceLabel(data);
    }
  } catch {
    /* ignore */
  }

  return `Near ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not supported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60_000,
    });
  });
}

function openGoogleMaps(opts: { lat?: number; lng?: number; query?: string }) {
  let href: string;
  if (opts.lat != null && opts.lng != null) {
    href = `https://www.google.com/maps/search/?api=1&query=${opts.lat},${opts.lng}`;
  } else if (opts.query?.trim()) {
    href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(opts.query.trim())}`;
  } else {
    href = "https://www.google.com/maps";
  }
  window.open(href, "_blank", "noopener,noreferrer");
}

function readDelivery(day: string): DeliveryEntry {
  const fallback: DeliveryEntry = { address: DEFAULT_ADDRESS_EN, window: "12-1" };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem("fylo:deliveryByDay");
    const map = raw ? (JSON.parse(raw) as Record<string, DeliveryEntry>) : {};
    return map[day] ?? fallback;
  } catch {
    return fallback;
  }
}

function writeDelivery(day: string, next: DeliveryEntry) {
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
}

function DeliverySlip({ day }: { day: string }) {
  const { t } = useLocale();
  const defaultAddress = t("lunches.delivery.defaultAddress");
  const [address, setAddress] = useState(defaultAddress);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [win, setWin] = useState<DeliveryWindow>("12-1");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(defaultAddress);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const entry = readDelivery(day);
    const addr = entry.address === DEFAULT_ADDRESS_EN ? defaultAddress : entry.address;
    setAddress(addr);
    setDraft(addr);
    setWin(entry.window);
    setCoords(entry.lat != null && entry.lng != null ? { lat: entry.lat, lng: entry.lng } : null);
    setSheetOpen(false);
    setError(null);
  }, [day, defaultAddress]);

  const persist = (next: DeliveryEntry) => {
    setAddress(next.address);
    setDraft(next.address);
    setWin(next.window);
    setCoords(next.lat != null && next.lng != null ? { lat: next.lat, lng: next.lng } : null);
    writeDelivery(day, next);
    logEvent("delivery_updated", {
      day,
      address: next.address,
      window: next.window,
      hasCoords: next.lat != null && next.lng != null,
    });
    syncLead();
  };

  const commitAddress = (val: string, nextCoords?: { lat: number; lng: number } | null) => {
    const clean = val.trim() || defaultAddress;
    persist({
      address: clean,
      window: win,
      ...(nextCoords
        ? { lat: nextCoords.lat, lng: nextCoords.lng }
        : coords
          ? { lat: coords.lat, lng: coords.lng }
          : {}),
    });
    setSheetOpen(false);
    setError(null);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const label = await reverseGeocode(lat, lng);
      setDraft(label);
      setCoords({ lat, lng });
      persist({ address: label, window: win, lat, lng });
      setSheetOpen(false);
      logEvent("delivery_located", { day, lat, lng });
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? (err as GeolocationPositionError).code : null;
      if (code === 1) {
        setError(t("location.error.denied"));
      } else if (code === 2 || code === 3) {
        setError(t("location.error.gps"));
      } else if (err instanceof Error && err.message === "Location is not supported on this device") {
        setError(t("location.error.unsupported"));
      } else {
        setError(err instanceof Error ? err.message : t("location.error.generic"));
      }
    } finally {
      setLocating(false);
    }
  };

  const cycleWindow = () => {
    const next: DeliveryWindow = win === "12-1" ? "1-3" : "12-1";
    persist({
      address,
      window: next,
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    });
  };

  const winLabel = win === "12-1" ? t("lunches.delivery.window12") : t("lunches.delivery.window13");
  const dayFull = t(DAY_FULL_KEYS[day] ?? "lunches.day.mon");

  return (
    <section className="mt-2 px-6">
      <div className="glass-control relative overflow-hidden rounded-[1.2rem] p-1">
        <div className="relative flex items-stretch gap-1">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[1rem] bg-white/55 px-2.5 py-2 ring-1 ring-black/[0.04]">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-3 w-3" strokeWidth={2.5} />
            </span>
            <button
              type="button"
              onClick={() => {
                setDraft(address);
                setError(null);
                setSheetOpen(true);
              }}
              className="min-w-0 flex-1 text-start group"
              aria-label={t("lunches.delivery.changeAria")}
            >
              <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                {t("lunches.delivery.to", { day: dayFull })}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-foreground">
                <span className="truncate">{address}</span>
                <Pencil
                  className="h-2.5 w-2.5 shrink-0 text-muted-foreground/70 group-hover:text-primary transition"
                  strokeWidth={2.4}
                />
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={cycleWindow}
            className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-[1rem] bg-secondary/70 px-3 py-2 ring-1 ring-black/[0.04] transition hover:bg-primary/10 hover:text-primary active:scale-[0.98]"
            aria-label={t("lunches.delivery.windowAria", { window: winLabel })}
          >
            <Clock className="h-3 w-3 text-muted-foreground" strokeWidth={2.5} />
            <span className="text-[10px] font-semibold text-foreground whitespace-nowrap">{winLabel}</span>
          </button>
        </div>
      </div>

      {sheetOpen && (
        <LocationSheet
          dayLabel={dayFull}
          draft={draft}
          setDraft={setDraft}
          locating={locating}
          error={error}
          onClose={() => {
            setSheetOpen(false);
            setError(null);
          }}
          onUseLocation={useCurrentLocation}
          onOpenMaps={() => {
            logEvent("delivery_maps_open", { day });
            openGoogleMaps({
              lat: coords?.lat,
              lng: coords?.lng,
              query: draft || address,
            });
          }}
          onSave={() => commitAddress(draft, coords)}
        />
      )}
    </section>
  );
}

function LocationSheet({
  dayLabel,
  draft,
  setDraft,
  locating,
  error,
  onClose,
  onUseLocation,
  onOpenMaps,
  onSave,
}: {
  dayLabel: string;
  draft: string;
  setDraft: (v: string) => void;
  locating: boolean;
  error: string | null;
  onClose: () => void;
  onUseLocation: () => void;
  onOpenMaps: () => void;
  onSave: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        onClick={onClose}
        aria-label={t("location.close")}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in"
      />
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-t-[2rem] md:rounded-[2rem] bg-background p-6 pb-8 shadow-[0_-20px_60px_-10px_oklch(0.2_0.02_20/0.25)] animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-border md:hidden" />

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-primary font-semibold">
              {t("location.eyebrow")}
            </div>
            <h3 className="mt-1 font-display text-[26px] leading-tight tracking-tight">
              {t("location.title", { day: dayLabel })}
            </h3>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-snug">
              {t("location.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground"
            aria-label={t("location.close")}
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>

        <button
          type="button"
          onClick={onUseLocation}
          disabled={locating}
          className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-3.5 text-start text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] disabled:opacity-70 active:scale-[0.99] transition"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
            ) : (
              <Navigation className="h-4 w-4" strokeWidth={2.5} />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">
              {locating ? t("location.finding") : t("location.useGps")}
            </span>
            <span className="block text-[11px] text-primary-foreground/75 mt-0.5">
              {t("location.useGpsHint")}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenMaps}
          className="mt-2.5 flex w-full items-center gap-3 rounded-2xl border border-black/10 bg-card px-4 py-3.5 text-start hover:border-primary/40 transition active:scale-[0.99]"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-foreground">
            <ExternalLink className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-foreground">{t("location.openMaps")}</span>
            <span className="block text-[11px] text-muted-foreground mt-0.5">
              {t("location.openMapsHint")}
            </span>
          </span>
        </button>

        <label className="mt-5 block">
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
            {t("location.address")}
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
            }}
            placeholder={t("location.addressPlaceholder")}
            className="mt-2 w-full rounded-2xl border border-black/[0.08] bg-card px-4 py-3.5 text-[14px] font-medium outline-none focus:border-primary transition text-start"
            aria-label={t("location.addressAria")}
          />
        </label>

        {error && (
          <p className="mt-3 text-[12px] leading-snug text-destructive" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onSave}
          className="mt-5 w-full rounded-full bg-foreground py-3.5 text-[14px] font-semibold text-background active:scale-[0.99] transition"
        >
          {t("location.save")}
        </button>
      </div>
    </div>
  );
}

function SelectedLunch({
  meal,
  order,
  day,
  onReset,
  onEdit,
}: {
  meal: Meal;
  order: DayOrder;
  day: string;
  onReset: () => void;
  onEdit: () => void;
}) {
  const { t, locale } = useLocale();
  const mealName = getMealName(meal.id, locale, meal.name);
  const dayFull = t(DAY_FULL_KEYS[day] ?? "lunches.day.mon");
  const foodTotal = dayFoodSubtotal(order);
  const extras = order.extraMealIds
    .map((id) => getMealById(id))
    .filter((m): m is Meal => Boolean(m));
  return (
    <section className="mt-8 px-6">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <h2 className="font-display text-[22px] tracking-tight">{t("lunches.selected.title", { day: dayFull })}</h2>
      </div>
      <p className="mt-1 ms-8 text-[11px] text-muted-foreground">
        {t("lunches.selected.hint")}
      </p>

      <article className="mt-4 overflow-hidden rounded-3xl bg-card shadow-card border border-primary/30 ring-2 ring-primary/15">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <img src={meal.image} alt={mealName} className="h-full w-full object-cover" />
          <span className="absolute start-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-primary-foreground">
            {t("lunches.selected.badge")}
          </span>
        </div>

        <div className="p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{meal.slot}</div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-[22px] leading-tight tracking-tight">{mealName}</h3>
              <div className="text-[12px] text-muted-foreground mt-0.5">{t("lunches.from", { restaurant: meal.restaurant })}</div>
            </div>
            <div className="text-end shrink-0">
              <div className="text-[18px] font-semibold text-primary leading-none">
                {formatPrice(meal.basePrice, t("common.na"))}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{t("common.sar")}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <MacroPill
              color="protein"
              value={t("lunches.macro.protein", {
                n: formatMacroGram(meal.protein, t("common.na")),
              })}
            />
            <MacroPill
              color="carbs"
              value={t("lunches.macro.carbs", {
                n: formatMacroGram(meal.carbs, t("common.na")),
              })}
            />
            <MacroPill
              color="fat"
              value={t("lunches.macro.fat", {
                n: formatMacroGram(meal.fat, t("common.na")),
              })}
            />
          </div>

          {extras.length > 0 && (
            <div className="mt-4 pt-4 border-t border-black/5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("lunches.selected.extras")}
              </div>
              <ul className="mt-2 space-y-1 text-[12px] text-foreground">
                {extras.map((m) => (
                  <li key={m.id} className="flex justify-between gap-2">
                    <span className="truncate">{getMealName(m.id, locale, m.name)}</span>
                    <span className="shrink-0 tabular-nums">{formatPrice(m.basePrice, t("common.na"))}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">{t("lunches.selected.foodTotal")}</span>
            <span className="font-semibold text-primary">{foodTotal} {t("common.sar")}</span>
          </div>

          <button
            type="button"
            onClick={onEdit}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary/10 py-3 text-[13px] font-semibold text-primary"
          >
            {t("lunches.selected.editExtras")}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-black/10 py-3 text-[13px] font-medium text-foreground hover:border-primary hover:text-primary transition"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
            {t("lunches.selected.change")}
          </button>
        </div>
      </article>
    </section>
  );
}

function Header() {

  const { t } = useLocale();
  return (
    <header className="px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <img src={pickyLogo} alt={t("common.brand")} className="mt-0.5 h-9 w-9 rounded-xl object-contain shrink-0" width={36} height={36} />
          <h1 className="font-display text-[18px] leading-[1.2] tracking-tight min-w-0">
            {t("lunches.hero.before")}
            <br />
            <span className="italic text-primary">{t("lunches.hero.italic")}</span>
          </h1>
        </div>
        <LocaleSwitch />
      </div>
    </header>
  );
}

function Dot({ color }: { color: "protein" | "carbs" | "fat" }) {
  const cls = color === "protein" ? "bg-protein" : color === "carbs" ? "bg-carbs" : "bg-fat";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`} />;
}

function Calendar({
  selected,
  completeDays,
  onSelect,
}: {
  selected: string;
  completeDays: Partial<Record<WorkDayId, DayOrder>>;
  onSelect: (d: string) => void;
}) {
  const { t, locale } = useLocale();
  return (
    <div className="mt-5 px-6">
      <div className="glass-control relative overflow-hidden rounded-[1.5rem] p-1.5">
        <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar">
          {days.map((day) => {
            const active = day.d === selected;
            const done =
              isWorkDay(day.d) && completeDays[day.d] && isDayOrderComplete(completeDays[day.d]);
            return (
              <button
                key={day.n}
                type="button"
                onClick={() => onSelect(day.d)}
                aria-pressed={active}
                className={`relative flex min-w-[3.1rem] flex-1 flex-col items-center gap-1 rounded-[1.1rem] px-1.5 py-2.5 transition active:scale-[0.97] ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_10px_24px_-12px_oklch(0.62_0.24_27/0.7)]"
                    : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
                }`}
              >
                {done && (
                  <span
                    className={`absolute top-1.5 end-1.5 h-1.5 w-1.5 rounded-full ${
                      active ? "bg-primary-foreground" : "bg-primary"
                    }`}
                  />
                )}
                <span
                  className={`text-[10px] font-semibold ${locale === "en" ? "uppercase tracking-[0.12em]" : ""} ${
                    active ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {t(DAY_SHORT_KEYS[day.d] ?? "lunches.dayShort.mon")}
                </span>
                <span
                  className={`text-[15px] font-semibold leading-none ${
                    active ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {day.n}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MoreOptions({
  tier,
  meals,
  onLoadMore,
  onChoose,
  isSaved,
  onToggleSave,
}: {
  tier: number;
  meals: Meal[];
  onLoadMore: () => void;
  onChoose: (m: Meal) => void;
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
}) {
  const { t, locale } = useLocale();
  const PAGE = 5;
  // tier 0 → nothing yet (CTA only); tier n → first n*PAGE meals
  const visible = tier > 0 ? meals.slice(0, tier * PAGE) : [];
  const canLoadMore = visible.length < meals.length;

  return (
    <section className="mt-8 px-6">
      {visible.length > 0 && (
        <>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-[20px] tracking-tight">{t("lunches.more.title")}</h2>
            <span className="text-[11px] text-muted-foreground">
              {visible.length === 1
                ? t("lunches.more.option", { count: visible.length })
                : t("lunches.more.options", { count: visible.length })}
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {visible.map((m, idx) => {
              const saved = isSaved(m.id);
              const name = getMealName(m.id, locale, m.name);
              return (
                <div
                  key={m.id}
                  className="relative flex items-center gap-3 rounded-2xl bg-card border border-black/[0.04] shadow-soft p-3 transition hover:border-primary/30 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => onChoose(m)}
                    className="flex items-center gap-3 text-start flex-1 min-w-0"
                  >
                    <img
                      src={m.image}
                      alt={name}
                      className="h-16 w-16 rounded-xl object-cover shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {t("lunches.more.rank", { rank: idx + 2, restaurant: m.restaurant })}
                      </div>
                      <div className="font-display text-[15px] leading-tight tracking-tight truncate">{name}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-primary">
                          {t("lunches.more.kcal", { kcal: formatKcal(m.kcal, t("common.na")) })}
                        </span>
                        <span>·</span>
                        <span>
                          {t("lunches.more.proteinShort", {
                            n: formatMacroGram(m.protein, t("common.na")),
                          })}
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleSave(m.id)}
                    aria-label={saved ? t("lunches.removeSaved") : t("lunches.saveMeal")}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground"
                  >
                    <Heart
                      className={`h-4 w-4 ${saved ? "fill-primary text-primary" : "text-foreground"}`}
                      strokeWidth={2}
                    />
                  </button>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 rtl-flip" />
                </div>
              );
            })}
          </div>
        </>
      )}

      {canLoadMore && (
        <button
          onClick={onLoadMore}
          className="mt-5 mx-auto flex items-center gap-2 rounded-full border border-black/15 bg-card px-5 py-3 text-[13px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
          style={{ display: "flex", margin: "20px auto 0" }}
        >
          {t("lunches.more.loadMore")}
          <span aria-hidden>🔍</span>
        </button>
      )}
    </section>
  );
}

function NoMoreMatches({ onReset }: { onReset: () => void }) {
  const { t } = useLocale();
  return (
    <section className="mt-8 px-6">
      <div className="rounded-3xl bg-card p-7 shadow-card border border-black/[0.04] text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blush text-blush-foreground">
          <Sparkles className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <h3 className="mt-4 font-display text-[22px] leading-tight tracking-tight">
          {t("lunches.empty.title")}
        </h3>
        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
          {t("lunches.empty.body")}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            to="/onboarding"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] active:scale-[0.99] transition"
          >
            {t("lunches.empty.updatePrefs")}
            <ArrowRight className="h-4 w-4 rtl-flip" strokeWidth={2.5} />
          </Link>
          <button
            onClick={onReset}
            className="flex w-full items-center justify-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-primary transition"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2.5} />
            {t("lunches.empty.startOver")}
          </button>
        </div>
      </div>
    </section>
  );
}

function MacroPill({ color, value }: { color: "protein" | "carbs" | "fat"; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground">
      <Dot color={color} />
      {value}
    </span>
  );
}

