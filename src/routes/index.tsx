import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Sparkles,
  Zap,
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
} from "lucide-react";

import logoAsset from "@/assets/fylo-logo.asset.json";
import { getMealsForDay, type Meal } from "@/lib/meals";
import { TabBar } from "@/components/tab-bar";
import { MacroTracker } from "@/components/macro-tracker";
import { useSavedMeals } from "@/hooks/use-saved-meals";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fylo — AI-curated lunches, delivered." },
      {
        name: "description",
        content:
          "Fylo is the first AI lunch decision app. It syncs with your fitness tracker and narrows the city to 5 perfect lunches a day.",
      },
      { property: "og:title", content: "Fylo — AI-curated lunches, delivered." },
      {
        property: "og:description",
        content:
          "Skip the scroll. Fylo picks 5 perfect lunches from your city every day, tuned to your body, budget and taste.",
      },
    ],
  }),
  component: Fylo,
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


function Fylo() {
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
    if (localStorage.getItem("fylo:welcomed") !== "1") {
      navigate({ to: "/welcome", replace: true });
    } else if (localStorage.getItem("fylo:onboarded") !== "1") {
      navigate({ to: "/onboarding", replace: true });
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
  const chosenMeal = chosenId ? allMeals.find((m) => m.id === chosenId) ?? null : null;

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
  };

  const resetChoice = () => {
    const next = { ...chosenByDay };
    delete next[selectedDay];
    setChosenByDay(next);
    persistDayMap(next);
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
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10">
      {/* Phone frame */}
      <div className="mx-auto w-full max-w-[420px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative">
        <div className="relative">
          {/* notch (desktop only) */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

          <main className="pb-32 pt-6 md:pt-10">
            <Header />

            <Calendar
              selected={selectedDay}
              onSelect={(d) => {
                setSelectedDay(d);
                setTier(0);
              }}
            />
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

          {sheetOpen && <MacroSheet meal={activeMeal} onClose={() => setSheetOpen(false)} />}
        </div>
      </div>
    </div>
  );
}


function SelectedLunch({ meal, onReset }: { meal: Meal; onReset: () => void }) {
  return (
    <section className="mt-8 px-6">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <h2 className="font-display text-[22px] tracking-tight">
          Today's Selected Lunch
        </h2>
      </div>
      <p className="mt-1 ml-8 text-[11px] text-muted-foreground">
        Macros added to your tracker · pick where to order it from
      </p>

      <article className="mt-4 overflow-hidden rounded-3xl bg-card shadow-card border border-primary/30 ring-2 ring-primary/15">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-primary-foreground">
            Selected
          </span>
        </div>

        <div className="p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {meal.slot}
          </div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-[22px] leading-tight tracking-tight">
                {meal.name}
              </h3>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                from {meal.restaurant}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[18px] font-semibold text-primary leading-none">
                {meal.kcal}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                kcal
              </div>
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
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] active:scale-[0.99] transition"
          >
            View Delivery Options
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>

          <button
            onClick={onReset}
            className="mt-3 flex w-full items-center justify-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-primary transition"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2.5} />
            Change Meal
          </button>
        </div>
      </article>
    </section>
  );
}


function Header() {
  return (
    <header className="px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src={logoAsset.url}
            alt="Fylo"
            className="h-10 w-10 rounded-xl object-cover"
            width={40}
            height={40}
          />
          <div className="leading-tight">
            <div className="font-display text-[22px] tracking-tight">Fylo</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">
              AI · curated for Picky
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-[11px] font-medium text-blush-foreground">
          <Zap className="h-3 w-3" strokeWidth={2.5} />
          Apple Health
        </span>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Your weekly lunch lineup
        </div>
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
  const cls =
    color === "protein" ? "bg-protein" : color === "carbs" ? "bg-carbs" : "bg-fat";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`} />;
}




function Calendar({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (d: string) => void;
}) {
  return (
    <div className="mt-6 px-6">
      <div className="flex items-end justify-between gap-1.5 overflow-x-auto no-scrollbar">
        {days.map((day) => {
          const active = day.d === selected;
          return (
            <button
              key={day.n}
              onClick={() => onSelect(day.d)}
              aria-pressed={active}
              className={`flex shrink-0 flex-col items-center gap-2 px-2.5 py-2 transition ${
                active ? "" : "opacity-60 hover:opacity-100"
              }`}
            >
              <span className="text-[11px] font-medium text-muted-foreground">
                {day.d}
              </span>
              <span
                className={`grid h-10 w-10 place-items-center rounded-full text-[14px] font-semibold transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-foreground"
                }`}
              >
                {day.n}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AiStatus({ count }: { count: number }) {

  return (
    <section className="mt-5 px-6">
      <div className="rounded-2xl bg-card p-4 shadow-card border border-black/[0.03]">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-snug text-foreground">
              <span className="font-semibold">{count} perfect lunches</span>{" "}
              found from <span className="font-semibold">79 restaurants</span>{" "}
              near you.
            </p>
          </div>
        </div>
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
        <h2 className="font-display text-[26px] tracking-tight">
          Today's best match
        </h2>
        <span className="text-[11px] text-muted-foreground">Top match</span>
      </div>

      <article
        key={meal.id}
        className="mt-4 group relative overflow-hidden rounded-3xl bg-card shadow-card border border-black/[0.03] animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <button
          type="button"
          onClick={() => onChoose(meal)}
          className="block w-full text-left"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <img
              src={meal.image}
              alt={meal.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
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
              <Heart
                className={`h-4 w-4 ${
                  saved ? "fill-primary text-primary" : "text-foreground"
                }`}
                strokeWidth={2}
              />
            </span>
          </div>
        </button>

        <div className="p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {meal.slot}
          </div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-[22px] leading-tight tracking-tight">
                {meal.name}
              </h3>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                from {meal.restaurant}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[18px] font-semibold text-primary leading-none">
                {meal.kcal}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                kcal
              </div>
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
              <button
                aria-label="Thumbs down"
                onClick={() =>
                  setVotes({
                    ...votes,
                    [meal.id]: vote === "down" ? undefined : "down",
                  })
                }
                className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                  vote === "down"
                    ? "border-foreground bg-foreground text-background"
                    : "border-black/10 bg-secondary text-foreground hover:border-black/25"
                }`}
              >
                <ThumbsDown className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                aria-label="Neutral"
                onClick={() =>
                  setVotes({
                    ...votes,
                    [meal.id]: vote === "neutral" ? undefined : "neutral",
                  })
                }
                className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                  vote === "neutral"
                    ? "border-foreground bg-foreground text-background"
                    : "border-black/10 bg-secondary text-foreground hover:border-black/25"
                }`}
              >
                <Meh className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                aria-label="Thumbs up"
                onClick={() =>
                  setVotes({
                    ...votes,
                    [meal.id]: vote === "up" ? undefined : "up",
                  })
                }
                className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                  vote === "up"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-black/10 bg-secondary text-foreground hover:border-black/25"
                }`}
              >
                <ThumbsUp className="h-4 w-4" strokeWidth={2} />
              </button>
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
  const canLoadMore =
    (tier === 0 && tier1.length > 0) || (tier === 1 && tier2.length > 0);
  const visible: Meal[] = [
    ...(tier >= 1 ? tier1 : []),
    ...(tier >= 2 ? tier2 : []),
  ];

  return (
    <section className="mt-8 px-6">
      {visible.length > 0 && (
        <>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-[20px] tracking-tight">
              More matches
            </h2>
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
                      <div className="font-display text-[15px] leading-tight tracking-tight truncate">
                        {m.name}
                      </div>
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
                      className={`h-4 w-4 ${
                        saved ? "fill-primary text-primary" : "text-foreground"
                      }`}
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
          You've seen every lunch that fits your active filters. Want to tweak
          your preferences?
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




function MacroPill({
  color,
  value,
}: {
  color: "protein" | "carbs" | "fat";
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground">
      <Dot color={color} />
      {value}
    </span>
  );
}


function MacroSheet({ meal, onClose }: { meal: Meal; onClose: () => void }) {
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
            <h3 className="mt-1 font-display text-[28px] leading-tight tracking-tight">
              {meal.name}
            </h3>
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
                <div className={`font-display text-[24px] leading-none ${s.c}`}>
                  {s.v}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 divide-y divide-border">
          {rows.map((r) => (
            <div
              key={r.label}
              className={`flex items-center justify-between py-3 ${
                r.sub ? "pl-4" : ""
              }`}
            >
              <span
                className={`text-[13px] ${
                  r.sub
                    ? "text-muted-foreground"
                    : r.bold
                      ? "font-semibold text-foreground"
                      : "text-foreground"
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
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Filtered for you
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {allergens.map((a) => (
              <span
                key={a}
                className="rounded-full bg-blush px-3 py-1 text-[11px] font-medium text-blush-foreground"
              >
                {a}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-primary py-4 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] active:scale-[0.99] transition"
        >
          Confirm & Order · {meal.kcal} kcal
        </button>
      </div>
    </div>
  );
}

