import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  X,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Check,
  ArrowRight,
  RotateCcw,
  MapPin,
  Clock,
  Pencil,
  TrendingDown,
  Wallet,
  Navigation,
  ExternalLink,
  Loader2,
} from "lucide-react";

import pickyLogo from "@/assets/picky-logo.png";
import { getMealById, getMealsForDay, mealPool, type Meal } from "@/lib/meals";
import { TabBar, phoneShellClass } from "@/components/tab-bar";
import { MacroTracker } from "@/components/macro-tracker";
import { syncLead, logEvent } from "@/lib/tracking";
import { useLocale } from "@/lib/i18n/locale";
import { getMealName } from "@/lib/i18n/meals-ar";

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
  { d: "Mon", n: 16 },
  { d: "Tue", n: 17 },
  { d: "Wed", n: 18 },
  { d: "Thu", n: 19 },
  { d: "Fri", n: 20 },
  { d: "Sat", n: 21 },
  { d: "Sun", n: 22 },
];

function Picky() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [tier, setTier] = useState(0);
  const [votes, setVotes] = useState<Record<string, "up" | "down" | "neutral" | undefined>>({});
  const [chosenByDay, setChosenByDay] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Default landing for the bare domain is the welcome page.
    // Only show the app home once onboarding is complete.
    if (localStorage.getItem("fylo:onboarded") !== "1") {
      navigate({ to: "/", replace: true });
    } else {
      setReady(true);
      try {
        const raw = localStorage.getItem("fylo:lunchOrderedByDay");
        if (raw) setChosenByDay(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fylo:activeDay", selectedDay);
    }
  }, [selectedDay]);

  // Full filtered pool so weekly lunch picks can reach every restaurant
  // (Al Baik / Shawarmer / Herfy included), not just the top 11.
  const allMeals = useMemo(
    () => getMealsForDay(selectedDay, mealPool.length),
    [selectedDay],
  );
  const topMeal = allMeals[0];
  const moreMeals = allMeals.slice(1);
  const [activeMeal, setActiveMeal] = useState<Meal>(allMeals[0]);
  const chosenId = chosenByDay[selectedDay] ?? null;
  const chosenMeal = chosenId ? getMealById(chosenId) ?? null : null;

  const persistDayMap = (next: Record<string, string>) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("fylo:lunchOrderedByDay", JSON.stringify(next));
    // Macro tracker mirrors the currently viewed day.
    const currentId = next[selectedDay];
    if (currentId) localStorage.setItem("fylo:lunchOrdered", currentId);
    else localStorage.removeItem("fylo:lunchOrdered");
    window.dispatchEvent(new Event("fylo:lunchOrdered"));
  };

  const chooseMeal = (m: Meal) => {
    const next = { ...chosenByDay, [selectedDay]: m.id };
    setChosenByDay(next);
    persistDayMap(next);
    logEvent("meal_chosen", { day: selectedDay, mealId: m.id, name: m.name });
    syncLead();
    navigate({ to: "/meal/$id", params: { id: m.id } });
  };

  const resetChoice = () => {
    const next = { ...chosenByDay };
    delete next[selectedDay];
    setChosenByDay(next);
    persistDayMap(next);
    logEvent("meal_reset", { day: selectedDay });
    syncLead();
    // Reveal all remaining matches immediately — no reshuffle.
    setTier(2);
  };

  // Keep macro tracker in sync when switching days.
  useEffect(() => {
    if (typeof window === "undefined" || !ready) return;
    const currentId = chosenByDay[selectedDay];
    if (currentId) localStorage.setItem("fylo:lunchOrdered", currentId);
    else localStorage.removeItem("fylo:lunchOrdered");
    window.dispatchEvent(new Event("fylo:lunchOrdered"));
  }, [selectedDay, chosenByDay, ready]);

  if (!ready) return <div className="min-h-screen bg-[oklch(0.94_0.005_30)]" />;

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10 overflow-x-hidden">
      {/* Phone frame */}
      <div className={phoneShellClass}>
        <div className="relative flex min-h-0 flex-1 flex-col">
          {/* notch (desktop only) */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

          <main className="flex-1 overflow-y-auto pb-8 pt-6 md:pt-10">
            <Header />
            <SavingsSummary />
            <Calendar
              selected={selectedDay}
              onSelect={(d) => {
                setSelectedDay(d);
                setTier(0);
              }}
            />
            <DeliverySlip day={selectedDay} />
            <AiStatus count={allMeals.length} />
            <MacroTracker />

            {chosenMeal ? (
              <SelectedLunch meal={chosenMeal} day={selectedDay} onReset={resetChoice} />
            ) : topMeal ? (
              <TopMatch
                meal={topMeal}
                votes={votes}
                setVotes={setVotes}
                onChoose={chooseMeal}
                onOpen={(m) => {
                  setActiveMeal(m);
                  setSheetOpen(true);
                }}
              />
            ) : (
              <NoMoreMatches onReset={() => setTier(0)} />
            )}

            {!chosenMeal && topMeal && (
              <MoreOptions
                tier={tier}
                meals={moreMeals}
                onLoadMore={() => setTier((t) => t + 1)}
                onChoose={chooseMeal}
              />
            )}
          </main>

          <TabBar active="lunches" />

          {sheetOpen && (
            <MacroSheet
              meal={activeMeal}
              onClose={() => setSheetOpen(false)}
              onConfirm={(m) => {
                setSheetOpen(false);
                chooseMeal(m);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

type DeliveryWindow = "12-1" | "1-3";
type DeliveryEntry = {
  address: string;
  window: DeliveryWindow;
  lat?: number;
  lng?: number;
};
const DEFAULT_ADDRESS_EN = "Office · Olaya Tower, 12F";
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
    <section className="mt-3 px-6">
      <div className="glass-control relative overflow-hidden rounded-[1.35rem] p-1.5">
        <div className="relative flex items-stretch gap-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[1.1rem] bg-white/55 px-3 py-2.5 ring-1 ring-black/[0.04]">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-3.5 w-3.5" strokeWidth={2.5} />
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
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                {t("lunches.delivery.to", { day: dayFull })}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
                <span className="truncate">{address}</span>
                <Pencil
                  className="h-3 w-3 shrink-0 text-muted-foreground/70 group-hover:text-primary transition"
                  strokeWidth={2.4}
                />
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={cycleWindow}
            className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-[1.1rem] bg-secondary/70 px-3.5 py-2.5 ring-1 ring-black/[0.04] transition hover:bg-primary/10 hover:text-primary active:scale-[0.98]"
            aria-label={t("lunches.delivery.windowAria", { window: winLabel })}
          >
            <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.5} />
            <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">{winLabel}</span>
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

function SelectedLunch({ meal, day, onReset }: { meal: Meal; day: string; onReset: () => void }) {
  const { t, locale } = useLocale();
  const mealName = getMealName(meal.id, locale, meal.name);
  const dayFull = t(DAY_FULL_KEYS[day] ?? "lunches.day.mon");
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
              <div className="text-[18px] font-semibold text-primary leading-none">{meal.basePrice}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{t("common.sar")}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <MacroPill color="protein" value={t("lunches.macro.protein", { n: meal.protein })} />
            <MacroPill color="carbs" value={t("lunches.macro.carbs", { n: meal.carbs })} />
            <MacroPill color="fat" value={t("lunches.macro.fat", { n: meal.fat })} />
          </div>

          <Link
            to="/meal/$id"
            params={{ id: meal.id }}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-[13px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)]"
          >
            {t("lunches.selected.compare")}
            <ArrowRight className="h-3.5 w-3.5 rtl-flip" strokeWidth={2.5} />
          </Link>

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

function SavingsSummary() {
  const { t } = useLocale();
  const optimized = 84;
  const baseline = 140;
  const saved = baseline - optimized;
  const pct = Math.min(100, (optimized / baseline) * 100);
  return (
    <section className="mt-6 px-6">
      <Link
        to="/savings"
        className="block rounded-3xl border border-black/[0.06] p-5 shadow-card transition active:scale-[0.99]"
        style={{ backgroundColor: "#ffffff", color: "#1c1917" }}
      >
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Wallet className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
              {t("lunches.savings.weeklySpend")}
            </div>
            <div className="mt-1 flex items-end justify-between gap-3">
              <div className="font-display text-[26px] leading-none tracking-tight text-foreground">
                {t("lunches.savings.amount", { optimized })}
                <span className="ms-1 text-[12px] font-sans text-muted-foreground">
                  {t("lunches.savings.baseline", { baseline })}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary shrink-0">
                <TrendingDown className="h-3 w-3" strokeWidth={3} />
                {t("lunches.savings.saved", { saved })}
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

function Header() {
  const { t } = useLocale();
  return (
    <header className="px-6">
      <div className="flex items-center gap-2.5">
        <img src={pickyLogo} alt={t("common.brand")} className="h-10 w-10 rounded-xl object-contain" width={40} height={40} />
        <div className="leading-tight">
          <div className="font-display text-[22px] tracking-tight">{t("common.brand")}</div>
          <div className="text-[11px] text-muted-foreground -mt-0.5">{t("lunches.brand.tagline")}</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("lunches.eyebrow")}</div>
        <h1 className="font-display text-[40px] leading-[1.05] tracking-tight">
          {t("lunches.hero.before")}
          <br />
          <span className="italic text-primary">{t("lunches.hero.italic")}</span>
        </h1>
      </div>
    </header>
  );
}

function Dot({ color }: { color: "protein" | "carbs" | "fat" }) {
  const cls = color === "protein" ? "bg-protein" : color === "carbs" ? "bg-carbs" : "bg-fat";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`} />;
}

function Calendar({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const { t } = useLocale();
  return (
    <div className="mt-5 px-6">
      <div className="glass-control relative overflow-hidden rounded-[1.5rem] p-1.5">
        <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar">
          {days.map((day) => {
            const active = day.d === selected;
            return (
              <button
                key={day.n}
                type="button"
                onClick={() => onSelect(day.d)}
                aria-pressed={active}
                className={`flex min-w-[3.1rem] flex-1 flex-col items-center gap-1 rounded-[1.1rem] px-1.5 py-2.5 transition active:scale-[0.97] ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_10px_24px_-12px_oklch(0.62_0.24_27/0.7)]"
                    : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
                }`}
              >
                <span
                  className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${
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

function AiStatus({ count }: { count: number }) {
  const { t } = useLocale();
  return (
    <section className="mt-3 px-6">
      <div className="glass-control flex items-center gap-3 rounded-2xl px-3.5 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-foreground">
          {t("lunches.aiStatus", { count })}
        </p>
      </div>
    </section>
  );
}

function TopMatch({
  meal,
  votes,
  setVotes,
  onChoose,
  onOpen,
}: {
  meal: Meal;
  votes: Record<string, "up" | "down" | "neutral" | undefined>;
  setVotes: (v: Record<string, "up" | "down" | "neutral" | undefined>) => void;
  onChoose: (m: Meal) => void;
  onOpen: (m: Meal) => void;
}) {
  void onOpen;
  const { t, locale } = useLocale();
  const mealName = getMealName(meal.id, locale, meal.name);
  const vote = votes[meal.id];
  return (
    <section className="mt-8 px-6">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-[26px] tracking-tight">{t("lunches.topMatch.title")}</h2>
        <span className="text-[11px] text-muted-foreground">{t("lunches.topMatch.badge")}</span>
      </div>

      <article
        key={meal.id}
        className="mt-4 group relative overflow-hidden rounded-3xl bg-card shadow-card border border-black/[0.03] animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <button type="button" onClick={() => onChoose(meal)} className="block w-full text-start">
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <img src={meal.image} alt={mealName} className="h-full w-full object-cover" loading="lazy" />
            <span className="absolute start-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-primary-foreground">
              {t("lunches.tag.topMatch")}
            </span>
          </div>
        </button>

        <div className="p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{meal.slot}</div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-[22px] leading-tight tracking-tight">{mealName}</h3>
              <div className="text-[12px] text-muted-foreground mt-0.5">{t("lunches.from", { restaurant: meal.restaurant })}</div>
            </div>
            <div className="text-end shrink-0">
              <div className="text-[18px] font-semibold text-primary leading-none">{meal.kcal}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{t("common.kcal")}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <MacroPill color="protein" value={t("lunches.macro.protein", { n: meal.protein })} />
            <MacroPill color="carbs" value={t("lunches.macro.carbs", { n: meal.carbs })} />
            <MacroPill color="fat" value={t("lunches.macro.fat", { n: meal.fat })} />
          </div>

          <button
            type="button"
            onClick={() => onChoose(meal)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] active:scale-[0.99] transition"
          >
            {t("lunches.selectLunch")}
            <ArrowRight className="h-4 w-4 rtl-flip" strokeWidth={2.5} />
          </button>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-[11px] text-muted-foreground">{t("lunches.feedback.prompt")}</div>
            <div className="flex items-center gap-2">
              {(["down", "neutral", "up"] as const).map((v) => {
                const Icon = v === "down" ? ThumbsDown : v === "neutral" ? Meh : ThumbsUp;
                const active = vote === v;
                const activeCls =
                  v === "up"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-foreground bg-foreground text-background";
                return (
                  <button
                    key={v}
                    aria-label={v === "down" ? t("lunches.feedback.thumbsDown") : v === "neutral" ? t("lunches.feedback.neutral") : t("lunches.feedback.thumbsUp")}
                    onClick={() => {
                      const next = active ? undefined : v;
                      setVotes({ ...votes, [meal.id]: next });
                      logEvent("meal_feedback", { mealId: meal.id, name: meal.name, vote: next ?? "cleared" });
                    }}
                    className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                      active ? activeCls : "border-black/10 bg-secondary text-foreground hover:border-black/25"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

function MoreOptions({
  tier,
  meals,
  onLoadMore,
  onChoose,
}: {
  tier: number;
  meals: Meal[];
  onLoadMore: () => void;
  onChoose: (m: Meal) => void;
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
              const name = getMealName(m.id, locale, m.name);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChoose(m)}
                  className="relative flex w-full items-center gap-3 rounded-2xl bg-card border border-black/[0.04] shadow-soft p-3 text-start transition hover:border-primary/30 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${idx * 40}ms` }}
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
                      <span className="font-semibold text-primary">{t("lunches.more.kcal", { kcal: m.kcal })}</span>
                      <span>·</span>
                      <span>{t("lunches.more.proteinShort", { n: m.protein })}</span>
                    </div>
                  </div>
                </button>
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

function MacroSheet({
  meal,
  onClose,
  onConfirm,
}: {
  meal: Meal;
  onClose: () => void;
  onConfirm: (m: Meal) => void;
}) {
  const { t, locale } = useLocale();
  const mealName = getMealName(meal.id, locale, meal.name);
  const rows = [
    { label: t("lunches.sheet.totalProtein"), value: `${meal.protein}g`, bold: true },
    { label: t("lunches.sheet.netCarbs"), value: `${meal.carbs - 4}g`, bold: true },
    { label: t("lunches.sheet.fiber"), value: "4g", sub: true },
    { label: t("lunches.sheet.sugars"), value: "6.2g", sub: true },
    { label: t("lunches.sheet.totalFat"), value: `${meal.fat}g`, bold: true },
    { label: t("lunches.sheet.saturated"), value: "5.1g", sub: true },
    { label: t("lunches.sheet.trans"), value: "0g", sub: true },
    { label: t("lunches.sheet.cholesterol"), value: "112mg", bold: true },
    { label: t("lunches.sheet.sodium"), value: "640mg", bold: true },
  ];
  const allergens = [
    t("lunches.sheet.glutenFree"),
    t("lunches.sheet.noPeanuts"),
    t("lunches.sheet.noShellfish"),
  ];
  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <button
        onClick={onClose}
        aria-label={t("common.close")}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in"
      />
      <div className="relative w-full max-h-[88%] overflow-y-auto rounded-t-[2rem] bg-background p-6 pb-8 shadow-[0_-20px_60px_-10px_oklch(0.2_0.02_20/0.25)] animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-border" />

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-primary font-semibold">
              {t("lunches.sheet.eyebrow")}
            </div>
            <h3 className="mt-1 font-display text-[28px] leading-tight tracking-tight">{mealName}</h3>
            <div className="mt-1 text-[12px] text-muted-foreground">
              {meal.restaurant} · {meal.slot}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-3xl bg-card p-5 shadow-soft border border-black/[0.03]">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { l: t("lunches.sheet.kcal"), v: meal.kcal, c: "text-primary" },
              { l: t("lunches.sheet.protein"), v: `${meal.protein}g`, c: "text-foreground" },
              { l: t("lunches.sheet.carbs"), v: `${meal.carbs}g`, c: "text-foreground" },
            ].map((s) => (
              <div key={s.l}>
                <div className={`font-display text-[24px] leading-none ${s.c}`}>{s.v}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 divide-y divide-border">
          {rows.map((r) => (
            <div key={r.label} className={`flex items-center justify-between py-3 ${r.sub ? "ps-4" : ""}`}>
              <span
                className={`text-[13px] ${
                  r.sub ? "text-muted-foreground" : r.bold ? "font-semibold text-foreground" : "text-foreground"
                }`}
              >
                {r.label}
              </span>
              <span
                className={`text-[13px] tabular-nums ${
                  r.sub ? "text-muted-foreground" : "font-semibold text-foreground"
                }`}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t("lunches.sheet.filtered")}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {allergens.map((a) => (
              <span key={a} className="rounded-full bg-blush px-3 py-1 text-[11px] font-medium text-blush-foreground">
                {a}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onConfirm(meal)}
          className="mt-6 w-full rounded-full bg-primary py-4 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] active:scale-[0.99] transition"
        >
          {t("lunches.sheet.compare")}
        </button>
      </div>
    </div>
  );
}
