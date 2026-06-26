import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Heart,
  Sparkles,
  MapPin,
  Clock,
  Zap,
  X,
  Pencil,
  ThumbsUp,
  ThumbsDown,
  Plus,
  TrendingDown,
  PiggyBank,
} from "lucide-react";
import logoAsset from "@/assets/fylo-logo.asset.json";
import { getMealsForDay, type Meal } from "@/lib/meals";
import { TabBar } from "@/components/tab-bar";


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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [visibleCount, setVisibleCount] = useState(5);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [votes, setVotes] = useState<Record<string, "up" | "down" | undefined>>({});

  const allMeals = useMemo(() => getMealsForDay(selectedDay, 10), [selectedDay]);
  const meals = allMeals.slice(0, visibleCount);
  const [activeMeal, setActiveMeal] = useState<Meal>(allMeals[0]);

  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10">
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
                setVisibleCount(5);
              }}
            />
            <AiStatus onOpen={() => setSheetOpen(true)} count={allMeals.length} />
            <Delivery />
            <MealStream
              meals={meals}
              total={allMeals.length}
              visibleCount={visibleCount}
              onShowMore={() => setVisibleCount(10)}
              liked={liked}
              setLiked={setLiked}
              votes={votes}
              setVotes={setVotes}
              onOpen={(m) => {
                setActiveMeal(m);
                setSheetOpen(true);
              }}
            />
          </main>

          <TabBar active="lunches" />

          {sheetOpen && <MacroSheet meal={activeMeal} onClose={() => setSheetOpen(false)} />}
        </div>
      </div>
    </div>
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
            className="h-9 w-9 rounded-xl object-cover"
            width={36}
            height={36}
          />
          <div className="leading-tight">
            <div className="font-display text-[22px] tracking-tight">Fylo</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">
              AI · curated for Layla
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
          Lunch · Monday
        </div>
        <h1 className="font-display text-[40px] leading-[1.05] tracking-tight">
          Today's perfect lunch,
          <br />
          <span className="italic text-primary">picked for you.</span>
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

function SavingsSummary() {
  const optimized = 84;
  const baseline = 140;
  const saved = baseline - optimized;
  const pct = (optimized / baseline) * 100;
  return (
    <section className="mt-6 px-6">
      <Link
        to="/savings"
        className="block rounded-3xl bg-foreground text-background p-5 shadow-card relative overflow-hidden"
      >
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/30 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <PiggyBank className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.16em] text-background/60 font-semibold">
              Weekly spend
            </div>
            <p className="mt-1 text-[13px] leading-snug text-background/90">
              This week's optimized lunches will cost you approx.{" "}
              <span className="font-semibold text-primary-foreground bg-primary px-1.5 py-0.5 rounded-md">
                ${optimized}
              </span>{" "}
              vs your typical{" "}
              <span className="line-through text-background/60">${baseline}</span>.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-background/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
                <TrendingDown className="h-3 w-3" strokeWidth={3} />${saved}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
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

function AiStatus({ onOpen, count }: { onOpen: () => void; count: number }) {

  return (
    <section className="mt-6 px-6">
      <div className="rounded-3xl bg-card p-5 shadow-card border border-black/[0.03]">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.16em] text-primary font-semibold">
              AI Status
            </div>
            <p className="mt-1 text-[14px] leading-snug text-foreground">
              <span className="font-semibold">{count} perfect lunches</span>{" "}
              found from <span className="font-semibold">218 restaurants</span>{" "}
              near you.
            </p>
            <button
              onClick={onOpen}
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary"
            >
              See why →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Delivery() {
  return (
    <section className="mt-3 px-6">
      <div className="rounded-3xl bg-blush/60 p-5 border border-blush">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-blush-foreground/80">
          <Clock className="h-3 w-3" strokeWidth={2.5} /> Scheduled delivery
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-[15px] font-semibold text-foreground">
            12:30 PM
          </div>
          <button
            aria-label="Edit time"
            className="grid h-8 w-8 place-items-center rounded-full bg-card text-foreground/70 border border-black/5 hover:text-primary transition"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1 text-[12px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">Office · 14 Rue Saint-Honoré</span>
          </div>
          <button
            aria-label="Edit location"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card text-foreground/70 border border-black/5 hover:text-primary transition"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </section>
  );
}

function MealStream({
  meals,
  total,
  visibleCount,
  onShowMore,
  liked,
  setLiked,
  votes,
  setVotes,
  onOpen,
}: {
  meals: Meal[];
  total: number;
  visibleCount: number;
  onShowMore: () => void;
  liked: Record<string, boolean>;
  setLiked: (v: Record<string, boolean>) => void;
  votes: Record<string, "up" | "down" | undefined>;
  setVotes: (v: Record<string, "up" | "down" | undefined>) => void;
  onOpen: (m: Meal) => void;
}) {
  void onOpen;
  const canShowMore = visibleCount < total;
  return (
    <section className="mt-8 px-6">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-[26px] tracking-tight">
          Today's lunch picks
        </h2>
        <span className="text-[11px] text-muted-foreground">
          Top {meals.length} of {total}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {meals.map((m) => {
          const vote = votes[m.id];
          return (
            <article
              key={m.id}
              className="group relative overflow-hidden rounded-3xl bg-card shadow-card border border-black/[0.03]"
            >
              <Link
                to="/meal/$id"
                params={{ id: m.id }}
                className="block w-full text-left"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <img
                    src={m.image}
                    alt={m.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {m.tag && (
                    <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-primary-foreground">
                      {m.tag}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLiked({ ...liked, [m.id]: !liked[m.id] });
                    }}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 backdrop-blur shadow-soft"
                    aria-label="Save"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        liked[m.id] ? "fill-primary text-primary" : "text-foreground"
                      }`}
                      strokeWidth={2}
                    />
                  </button>
                </div>
              </Link>

              <div className="p-5">
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {m.slot}
                </div>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-[20px] leading-tight tracking-tight truncate">
                      {m.name}
                    </h3>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      from {m.restaurant}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[18px] font-semibold text-primary leading-none">
                      {m.kcal}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                      kcal
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <MacroPill color="protein" value={`${m.protein}g protein`} />
                  <MacroPill color="carbs" value={`${m.carbs}g carbs`} />
                  <MacroPill color="fat" value={`${m.fat}g fat`} />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground">
                    Teach Fylo
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      aria-label="Thumbs down"
                      onClick={() =>
                        setVotes({
                          ...votes,
                          [m.id]: vote === "down" ? undefined : "down",
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
                      aria-label="Thumbs up"
                      onClick={() =>
                        setVotes({
                          ...votes,
                          [m.id]: vote === "up" ? undefined : "up",
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
          );
        })}

        {canShowMore && (
          <button
            onClick={onShowMore}
            className="group mx-auto flex items-center gap-2 rounded-full border border-dashed border-black/15 bg-card px-5 py-3 text-[13px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
            style={{ display: "flex", margin: "0 auto" }}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:scale-105">
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            Show More Lunch Matches
            <span className="text-muted-foreground font-medium">
              ({total - visibleCount} more)
            </span>
          </button>
        )}
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

