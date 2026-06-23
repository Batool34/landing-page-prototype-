import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Heart,
  Sparkles,
  MapPin,
  Clock,
  Zap,
  X,
  Home,
  ClipboardList,
  SlidersHorizontal,
  BarChart3,
  Activity,
  Pencil,
} from "lucide-react";
import logoAsset from "@/assets/fylo-logo.asset.json";
import pancakes from "@/assets/meal-pancakes.jpg";
import chickenBowl from "@/assets/meal-chicken-bowl.jpg";
import poke from "@/assets/meal-poke.jpg";
import proteinBites from "@/assets/meal-protein-bites.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fylo — AI-curated meals, delivered." },
      {
        name: "description",
        content:
          "Fylo is the first AI food decision app. It syncs with your fitness tracker and narrows the city to 3–5 perfect meals a day.",
      },
      { property: "og:title", content: "Fylo — AI-curated meals, delivered." },
      {
        property: "og:description",
        content:
          "Skip the scroll. Fylo picks 3–5 perfect meals from your city every day, tuned to your body and taste.",
      },
    ],
  }),
  component: Fylo,
});

type Meal = {
  id: string;
  slot: string;
  name: string;
  restaurant: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  image: string;
  tag?: string;
};

const meals: Meal[] = [
  {
    id: "1",
    slot: "Breakfast · 8:00 AM",
    name: "Protein Banana Pancakes",
    restaurant: "Maison Cleo",
    kcal: 420,
    protein: 32,
    carbs: 48,
    fat: 12,
    image: pancakes,
    tag: "Top match",
  },
  {
    id: "2",
    slot: "Lunch · 12:30 PM",
    name: "Grilled Chicken & Jasmine Rice",
    restaurant: "Greenhouse Kitchen",
    kcal: 605,
    protein: 58,
    carbs: 51,
    fat: 19,
    image: chickenBowl,
  },
  {
    id: "3",
    slot: "Dinner · 7:15 PM",
    name: "Wild Salmon Poke Bowl",
    restaurant: "Hokku",
    kcal: 540,
    protein: 41,
    carbs: 44,
    fat: 22,
    image: poke,
  },
  {
    id: "4",
    slot: "Snack · 4:00 PM",
    name: "Cinnamon Protein Bites",
    restaurant: "Pantry Co.",
    kcal: 250,
    protein: 21,
    carbs: 35,
    fat: 3,
    image: proteinBites,
  },
];

const days = [
  { d: "Mon", n: 16, today: true },
  { d: "Tue", n: 17 },
  { d: "Wed", n: 18 },
  { d: "Thu", n: 19 },
  { d: "Fri", n: 20 },
  { d: "Sat", n: 21 },
  { d: "Sun", n: 22 },
];

function Fylo() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState<Meal>(meals[1]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const totalKcal = meals.reduce((a, m) => a + m.kcal, 0);
  const targetKcal = 1815;

  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10">
      {/* Phone frame */}
      <div className="mx-auto w-full max-w-[420px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative">
        <div className="relative">
          {/* notch (desktop only) */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

          <main className="pb-32 pt-6 md:pt-10">
            <Header />
            <Calendar />
            <AiStatus onOpen={() => setSheetOpen(true)} />
            <Delivery />
            <MealStream
              meals={meals}
              liked={liked}
              setLiked={setLiked}
              onOpen={(m) => {
                setActiveMeal(m);
                setSheetOpen(true);
              }}
            />
            <MacroProgress
              totalKcal={totalKcal}
              targetKcal={targetKcal}
              onOpen={() => setSheetOpen(true)}
            />
          </main>

          <TabBar />

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
          Today · Sunday
        </div>
        <h1 className="font-display text-[44px] leading-[1.05] tracking-tight">
          Three perfect meals,
          <br />
          <span className="italic text-primary">picked for you.</span>
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground">
          <span className="font-semibold text-foreground">1,439 kcal</span>
          <Dot color="protein" /> 137g protein
          <Dot color="carbs" /> 128g carbs
          <Dot color="fat" /> 42g fat
        </div>
      </div>
    </header>
  );
}

function Dot({ color }: { color: "protein" | "carbs" | "fat" }) {
  const cls =
    color === "protein" ? "bg-protein" : color === "carbs" ? "bg-carbs" : "bg-fat";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`} />;
}

function Calendar() {
  return (
    <div className="mt-6 px-6">
      <div className="flex items-end justify-between gap-1.5 overflow-x-auto no-scrollbar">
        {days.map((day) => (
          <button
            key={day.n}
            aria-pressed={day.today}
            className={`flex shrink-0 flex-col items-center gap-2 px-2.5 py-2 transition ${
              day.today ? "" : "opacity-60 hover:opacity-100"
            }`}
          >
            <span className="text-[11px] font-medium text-muted-foreground">
              {day.d}
            </span>
            <span
              className={`grid h-10 w-10 place-items-center rounded-full text-[14px] font-semibold ${
                day.today
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-foreground"
              }`}
            >
              {day.n}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AiStatus({ onOpen }: { onOpen: () => void }) {
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
              <span className="font-semibold">3 perfect matches</span> found from{" "}
              <span className="font-semibold">218 restaurants</span> near you.
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
  liked,
  setLiked,
  onOpen,
}: {
  meals: Meal[];
  liked: Record<string, boolean>;
  setLiked: (v: Record<string, boolean>) => void;
  onOpen: (m: Meal) => void;
}) {
  return (
    <section className="mt-8 px-6">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-[26px] tracking-tight">Today's plate</h2>
        <span className="text-[11px] text-muted-foreground">{meals.length} meals</span>
      </div>

      <div className="mt-4 space-y-4">
        {meals.map((m) => (
          <article
            key={m.id}
            className="group relative overflow-hidden rounded-3xl bg-card shadow-card border border-black/[0.03]"
          >
            <button onClick={() => onOpen(m)} className="block w-full text-left">
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
            </button>

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
                <div className="text-[11px] text-muted-foreground">Teach Fylo</div>
                <div className="flex items-center gap-1.5">
                  {["😐", "🙂", "😍"].map((e, i) => (
                    <button
                      key={i}
                      className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-[16px] transition hover:bg-blush"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
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

function MacroProgress({
  totalKcal,
  targetKcal,
  onOpen,
}: {
  totalKcal: number;
  targetKcal: number;
  onOpen: () => void;
}) {
  const pct = Math.min(100, (totalKcal / targetKcal) * 100);
  const bars = [
    { label: "Protein", color: "bg-protein", current: 152, target: 165, unit: "g" },
    { label: "Carbs", color: "bg-carbs", current: 178, target: 220, unit: "g" },
    { label: "Fat", color: "bg-fat", current: 56, target: 72, unit: "g" },
  ];
  return (
    <section className="mt-6 px-6">
      <button
        onClick={onOpen}
        className="w-full text-left rounded-3xl bg-card p-5 shadow-card border border-black/[0.03]"
      >
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Daily intake
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-[34px] leading-none tracking-tight">
                {totalKcal.toLocaleString()}
              </span>
              <span className="text-[12px] text-muted-foreground">
                / {targetKcal.toLocaleString()} kcal
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground">Remaining</div>
            <div className="text-[18px] font-semibold text-primary">
              {Math.max(0, targetKcal - totalKcal)}
            </div>
          </div>
        </div>

        <div className="mt-4 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-5 space-y-3">
          {bars.map((b) => {
            const p = Math.min(100, (b.current / b.target) * 100);
            return (
              <div key={b.label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-foreground">{b.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {b.current}/{b.target}
                    {b.unit}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full ${b.color}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </button>
    </section>
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

function TabBar() {
  const tabs = [
    { icon: Home, label: "For you", active: true },
    { icon: ClipboardList, label: "Orders" },
    { icon: SlidersHorizontal, label: "Filter" },
    { icon: BarChart3, label: "Stats" },
    { icon: Activity, label: "Fitness" },
  ];
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-20 bg-background/85 backdrop-blur-xl border-t border-black/5">
      <div className="grid grid-cols-5 px-2 pt-2 pb-3">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              className={`flex flex-col items-center gap-1 rounded-xl py-1.5 ${
                t.active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
