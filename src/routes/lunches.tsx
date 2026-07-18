import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
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
import { getMealsForDay, type Meal } from "@/lib/meals";
import { TabBar } from "@/components/tab-bar";
import { MacroTracker } from "@/components/macro-tracker";
import { useSavedMeals } from "@/hooks/use-saved-meals";
import { syncLead, logEvent } from "@/lib/tracking";

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
  const { isSaved, toggle: toggleSaved } = useSavedMeals();
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

  const allMeals = useMemo(() => getMealsForDay(selectedDay, 11), [selectedDay]);
  const topMeal = allMeals[0];
  const tier1 = allMeals.slice(1, 6);
  const tier2 = allMeals.slice(6, 11);
  const [activeMeal, setActiveMeal] = useState<Meal>(allMeals[0]);
  const chosenId = chosenByDay[selectedDay] ?? null;
  const chosenMeal = chosenId ? (allMeals.find((m) => m.id === chosenId) ?? null) : null;

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
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10 overflow-x-hidden">
      {/* Phone frame */}
      <div className="mx-auto w-full max-w-[420px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative">
        <div className="relative">
          {/* notch (desktop only) */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

          <main className="pb-32 pt-6 md:pt-10">
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
                isSaved={isSaved}
                onToggleSave={toggleSaved}
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
                tier1={tier1}
                tier2={tier2}
                onLoadMore={() => setTier((t) => t + 1)}
                onChoose={chooseMeal}
                isSaved={isSaved}
                onToggleSave={toggleSaved}
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
const DEFAULT_ADDRESS = "Office · Olaya Tower, 12F";
const DAY_FULL: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
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
  return raw || DEFAULT_ADDRESS;
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
  const fallback: DeliveryEntry = { address: DEFAULT_ADDRESS, window: "12-1" };
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
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [win, setWin] = useState<DeliveryWindow>("12-1");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_ADDRESS);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const entry = readDelivery(day);
    setAddress(entry.address);
    setDraft(entry.address);
    setWin(entry.window);
    setCoords(entry.lat != null && entry.lng != null ? { lat: entry.lat, lng: entry.lng } : null);
    setSheetOpen(false);
    setError(null);
  }, [day]);

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
    const clean = val.trim() || DEFAULT_ADDRESS;
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
        setError("Location permission denied. You can type an address or open Google Maps.");
      } else if (code === 2 || code === 3) {
        setError("Couldn't get a GPS fix. Try again outdoors, or open Google Maps.");
      } else {
        setError(err instanceof Error ? err.message : "Couldn't detect your location.");
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

  const winLabel = win === "12-1" ? "12 – 1 PM" : "1 – 3 PM";

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
              className="min-w-0 flex-1 text-left group"
              aria-label="Change delivery location"
            >
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                Deliver to · {DAY_FULL[day] ?? day}
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
            aria-label={`Arrival window ${winLabel} — tap to change`}
          >
            <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.5} />
            <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">{winLabel}</span>
          </button>
        </div>
      </div>

      {sheetOpen && (
        <LocationSheet
          dayLabel={DAY_FULL[day] ?? day}
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
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in"
      />
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-t-[2rem] md:rounded-[2rem] bg-background p-6 pb-8 shadow-[0_-20px_60px_-10px_oklch(0.2_0.02_20/0.25)] animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-border md:hidden" />

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-primary font-semibold">
              Delivery location
            </div>
            <h3 className="mt-1 font-display text-[26px] leading-tight tracking-tight">
              Where should we drop {dayLabel}'s lunch?
            </h3>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-snug">
              Use your GPS to fill it automatically, or open Google Maps to pick a spot.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>

        <button
          type="button"
          onClick={onUseLocation}
          disabled={locating}
          className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-3.5 text-left text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] disabled:opacity-70 active:scale-[0.99] transition"
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
              {locating ? "Finding you…" : "Use my current location"}
            </span>
            <span className="block text-[11px] text-primary-foreground/75 mt-0.5">
              We'll ask for permission, then fill the address for you
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenMaps}
          className="mt-2.5 flex w-full items-center gap-3 rounded-2xl border border-black/10 bg-card px-4 py-3.5 text-left hover:border-primary/40 transition active:scale-[0.99]"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-foreground">
            <ExternalLink className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-foreground">Open Google Maps</span>
            <span className="block text-[11px] text-muted-foreground mt-0.5">
              Browse the pin, then paste or type the place below
            </span>
          </span>
        </button>

        <label className="mt-5 block">
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
            Address
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
            }}
            placeholder="Building, street, district…"
            className="mt-2 w-full rounded-2xl border border-black/[0.08] bg-card px-4 py-3.5 text-[14px] font-medium outline-none focus:border-primary transition"
            aria-label="Delivery address"
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
          Save location
        </button>
      </div>
    </div>
  );
}

function SelectedLunch({ meal, day, onReset }: { meal: Meal; day: string; onReset: () => void }) {
  return (
    <section className="mt-8 px-6">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <h2 className="font-display text-[22px] tracking-tight">Your {DAY_FULL[day] ?? day} lunch</h2>
      </div>
      <p className="mt-1 ml-8 text-[11px] text-muted-foreground">
        Compare HungerStation, Jahez & Keeta — then order on the best app.
      </p>

      <article className="mt-4 overflow-hidden rounded-3xl bg-card shadow-card border border-primary/30 ring-2 ring-primary/15">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-primary-foreground">
            Selected
          </span>
        </div>

        <div className="p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{meal.slot}</div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-[22px] leading-tight tracking-tight">{meal.name}</h3>
              <div className="text-[12px] text-muted-foreground mt-0.5">from {meal.restaurant}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[18px] font-semibold text-primary leading-none">{meal.basePrice}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">SAR</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <MacroPill color="protein" value={`${meal.protein}g protein`} />
            <MacroPill color="carbs" value={`${meal.carbs}g carbs`} />
            <MacroPill color="fat" value={`${meal.fat}g fat`} />
          </div>

          <Link
            to="/meal/$id"
            params={{ id: meal.id }}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-[13px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)]"
          >
            Compare prices & order
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>

          <button
            type="button"
            onClick={onReset}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-black/10 py-3 text-[13px] font-medium text-foreground hover:border-primary hover:text-primary transition"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
            Change Meal
          </button>
        </div>
      </article>
    </section>
  );
}

function SavingsSummary() {
  const optimized = 84;
  const baseline = 140;
  const saved = baseline - optimized;
  const pct = (optimized / baseline) * 100;
  return (
    <section className="mt-6 px-6">
      <Link
        to="/savings"
        className="glass-spend block rounded-3xl p-5 relative overflow-hidden transition active:scale-[0.99]"
      >
        <div
          className="absolute -right-10 -top-12 h-40 w-40 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: "oklch(0.62 0.24 27 / 0.45)" }}
        />
        <div
          className="absolute -left-8 bottom-[-2rem] h-32 w-32 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: "oklch(0.82 0.15 85 / 0.28)" }}
        />
        <div className="relative flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_28px_-12px_oklch(0.62_0.24_27/0.85)] ring-1 ring-white/20">
            <Wallet className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/55 font-semibold">
              Weekly spend
            </div>
            <p className="mt-1 text-[13px] leading-snug text-white/85">
              This week's optimized lunches will cost you approx.{" "}
              <span className="font-semibold text-primary-foreground bg-primary px-1.5 py-0.5 rounded-md shadow-[0_6px_16px_-8px_oklch(0.62_0.24_27/0.9)]">
                SAR {optimized}
              </span>{" "}
              vs your typical{" "}
              <span className="line-through text-white/40">SAR {baseline}</span>.
            </p>
            <div className="mt-3.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden ring-1 ring-white/10">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className="inline-flex items-center gap-1 text-[12px] font-semibold"
                style={{ color: "oklch(0.82 0.15 85)" }}
              >
                <TrendingDown className="h-3 w-3" strokeWidth={3} />
                SAR {saved}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

function Header() {
  return (
    <header className="px-6">
      <div className="flex items-center gap-2.5">
        <img src={pickyLogo} alt="Picky" className="h-10 w-10 rounded-xl object-contain" width={40} height={40} />
        <div className="leading-tight">
          <div className="font-display text-[22px] tracking-tight">Picky</div>
          <div className="text-[11px] text-muted-foreground -mt-0.5">AI · curated for Picky</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Your weekly lunch lineup</div>
        <h1 className="font-display text-[40px] leading-[1.05] tracking-tight">
          Plan your week,
          <br />
          <span className="italic text-primary">one lunch at a time.</span>
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
                  {day.d}
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
  return (
    <section className="mt-3 px-6">
      <div className="glass-control flex items-center gap-3 rounded-2xl px-3.5 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-foreground">
          <span className="font-semibold">{count} perfect lunches</span> found from{" "}
          <span className="font-semibold">79 restaurants</span> near you.
        </p>
      </div>
    </section>
  );
}

function TopMatch({
  meal,
  isSaved,
  onToggleSave,
  votes,
  setVotes,
  onChoose,
  onOpen,
}: {
  meal: Meal;
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
  votes: Record<string, "up" | "down" | "neutral" | undefined>;
  setVotes: (v: Record<string, "up" | "down" | "neutral" | undefined>) => void;
  onChoose: (m: Meal) => void;
  onOpen: (m: Meal) => void;
}) {
  void onOpen;
  const vote = votes[meal.id];
  const saved = isSaved(meal.id);
  return (
    <section className="mt-8 px-6">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-[26px] tracking-tight">Today's best match</h2>
        <span className="text-[11px] text-muted-foreground">Top match</span>
      </div>

      <article
        key={meal.id}
        className="mt-4 group relative overflow-hidden rounded-3xl bg-card shadow-card border border-black/[0.03] animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <button type="button" onClick={() => onChoose(meal)} className="block w-full text-left">
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" loading="lazy" />
            <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-primary-foreground">
              Top match
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave(meal.id);
              }}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 backdrop-blur shadow-soft cursor-pointer"
              aria-label={saved ? "Remove from saved" : "Save meal"}
            >
              <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : "text-foreground"}`} strokeWidth={2} />
            </span>
          </div>
        </button>

        <div className="p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{meal.slot}</div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-[22px] leading-tight tracking-tight">{meal.name}</h3>
              <div className="text-[12px] text-muted-foreground mt-0.5">from {meal.restaurant}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[18px] font-semibold text-primary leading-none">{meal.kcal}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">kcal</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <MacroPill color="protein" value={`${meal.protein}g protein`} />
            <MacroPill color="carbs" value={`${meal.carbs}g carbs`} />
            <MacroPill color="fat" value={`${meal.fat}g fat`} />
          </div>

          <button
            type="button"
            onClick={() => onChoose(meal)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] active:scale-[0.99] transition"
          >
            Select this lunch
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-[11px] text-muted-foreground">Love it or hate it? We're listening.</div>
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
                    aria-label={v === "down" ? "Thumbs down" : v === "neutral" ? "Neutral" : "Thumbs up"}
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
  tier1,
  tier2,
  onLoadMore,
  onChoose,
  isSaved,
  onToggleSave,
}: {
  tier: number;
  tier1: Meal[];
  tier2: Meal[];
  onLoadMore: () => void;
  onChoose: (m: Meal) => void;
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
}) {
  const canLoadMore = (tier === 0 && tier1.length > 0) || (tier === 1 && tier2.length > 0);
  const visible: Meal[] = [...(tier >= 1 ? tier1 : []), ...(tier >= 2 ? tier2 : [])];

  return (
    <section className="mt-8 px-6">
      {visible.length > 0 && (
        <>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-[20px] tracking-tight">More matches</h2>
            <span className="text-[11px] text-muted-foreground">
              {visible.length} option{visible.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {visible.map((m, idx) => {
              const saved = isSaved(m.id);
              return (
                <div
                  key={m.id}
                  className="relative flex items-center gap-3 rounded-2xl bg-card border border-black/[0.04] shadow-soft p-3 transition hover:border-primary/30 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => onChoose(m)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    <img
                      src={m.image}
                      alt={m.name}
                      className="h-16 w-16 rounded-xl object-cover shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        #{idx + 2} · {m.restaurant}
                      </div>
                      <div className="font-display text-[15px] leading-tight tracking-tight truncate">{m.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-primary">{m.kcal} kcal</span>
                        <span>·</span>
                        <span>{m.protein}g P</span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleSave(m.id)}
                    aria-label={saved ? "Remove from saved" : "Save meal"}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground"
                  >
                    <Heart
                      className={`h-4 w-4 ${saved ? "fill-primary text-primary" : "text-foreground"}`}
                      strokeWidth={2}
                    />
                  </button>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
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
          Load more options
          <span aria-hidden>🔍</span>
        </button>
      )}
    </section>
  );
}

function NoMoreMatches({ onReset }: { onReset: () => void }) {
  return (
    <section className="mt-8 px-6">
      <div className="rounded-3xl bg-card p-7 shadow-card border border-black/[0.04] text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blush text-blush-foreground">
          <Sparkles className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <h3 className="mt-4 font-display text-[22px] leading-tight tracking-tight">
          That's all the perfect matches for today
        </h3>
        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
          You've seen every lunch that fits your active filters. Want to tweak your preferences?
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            to="/onboarding"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] active:scale-[0.99] transition"
          >
            Update my preferences
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <button
            onClick={onReset}
            className="flex w-full items-center justify-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-primary transition"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2.5} />
            Start over from top match
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
  const rows = [
    { label: "Total protein", value: `${meal.protein}g`, bold: true },
    { label: "Net carbs", value: `${meal.carbs - 4}g`, bold: true },
    { label: "Dietary fiber", value: "4g", sub: true },
    { label: "Sugars", value: "6.2g", sub: true },
    { label: "Total fat", value: `${meal.fat}g`, bold: true },
    { label: "Saturated", value: "5.1g", sub: true },
    { label: "Trans", value: "0g", sub: true },
    { label: "Cholesterol", value: "112mg", bold: true },
    { label: "Sodium", value: "640mg", bold: true },
  ];
  const allergens = ["Gluten-free", "No peanuts", "No shellfish"];
  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in"
      />
      <div className="relative w-full max-h-[88%] overflow-y-auto rounded-t-[2rem] bg-background p-6 pb-8 shadow-[0_-20px_60px_-10px_oklch(0.2_0.02_20/0.25)] animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-border" />

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-primary font-semibold">
              AI Macro & Allergen
            </div>
            <h3 className="mt-1 font-display text-[28px] leading-tight tracking-tight">{meal.name}</h3>
            <div className="mt-1 text-[12px] text-muted-foreground">
              {meal.restaurant} · {meal.slot}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-3xl bg-card p-5 shadow-soft border border-black/[0.03]">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { l: "kcal", v: meal.kcal, c: "text-primary" },
              { l: "protein", v: `${meal.protein}g`, c: "text-foreground" },
              { l: "carbs", v: `${meal.carbs}g`, c: "text-foreground" },
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
            <div key={r.label} className={`flex items-center justify-between py-3 ${r.sub ? "pl-4" : ""}`}>
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
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Filtered for you</div>
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
          Compare prices & order
        </button>
      </div>
    </div>
  );
}
