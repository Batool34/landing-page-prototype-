import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  Watch,
  Smartphone,
  MapPin,
  Sparkles,
  Check,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Calibrate your Fylo engine" },
      {
        name: "description",
        content:
          "A 7-step calibration that teaches Fylo your body, taste and budget so it can pick the perfect lunch every day.",
      },
    ],
  }),
  component: Onboarding,
});

const trackers = [
  { id: "apple", label: "Apple Health", Icon: Smartphone },
  { id: "fitbit", label: "Fitbit", Icon: Watch },
  { id: "garmin", label: "Garmin", Icon: Activity },
];

const diets = ["None", "Vegan", "Vegetarian", "Keto", "Gluten-Free", "Halal", "Pescatarian"];
const allergens = ["Nut-free", "Dairy-free", "Egg-free", "Shellfish-free", "Soy-free"];
const cuisines = [
  { id: "med", label: "Mediterranean", emoji: "🥙" },
  { id: "jp", label: "Japanese", emoji: "🍣" },
  { id: "lev", label: "Levantine", emoji: "🥗" },
  { id: "it", label: "Italian", emoji: "🍝" },
  { id: "mx", label: "Mexican", emoji: "🌮" },
  { id: "in", label: "Indian", emoji: "🍛" },
  { id: "th", label: "Thai", emoji: "🍜" },
  { id: "us", label: "American", emoji: "🍔" },
];
const goals = [
  { id: "lose", label: "Lose weight", sub: "Calorie deficit" },
  { id: "maintain", label: "Maintain", sub: "Recomposition" },
  { id: "gain", label: "Gain muscle", sub: "Protein-forward" },
];

function Onboarding() {
  const navigate = useNavigate();
  const [tracker, setTracker] = useState("apple");
  const [diet, setDiet] = useState<string[]>(["None"]);
  const [allergy, setAllergy] = useState<string[]>([]);
  const [ranked, setRanked] = useState<string[]>([]);
  const [budget, setBudget] = useState(55);
  const [goal, setGoal] = useState("maintain");
  const [city, setCity] = useState("Riyadh");

  const toggleSet = (arr: string[], v: string, setter: (a: string[]) => void) => {
    if (arr.includes(v)) setter(arr.filter((x) => x !== v));
    else setter([...arr, v]);
  };

  const toggleRank = (id: string) => {
    if (ranked.includes(id)) setRanked(ranked.filter((x) => x !== id));
    else if (ranked.length < 3) setRanked([...ranked, id]);
  };

  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10">
      <div className="mx-auto w-full max-w-[420px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative">
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className="px-6 pt-10 pb-40">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-[11px] font-medium text-blush-foreground">
            <Sparkles className="h-3 w-3" strokeWidth={2.5} /> Calibration · 7 steps
          </div>
          <h1 className="mt-4 font-display text-[36px] leading-[1.05] tracking-tight">
            Let's calibrate your{" "}
            <span className="italic text-primary">Fylo engine.</span>
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Tell Fylo about your body, taste and budget. We'll narrow the city
            down to the perfect lunch every day.
          </p>

          {/* 1. Tracker */}
          <Block n={1} title="Sync a fitness tracker">
            <div className="grid grid-cols-3 gap-2">
              {trackers.map(({ id, label, Icon }) => {
                const active = tracker === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTracker(id)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-[11px] font-medium transition ${
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-black/[0.06] bg-card text-foreground hover:border-black/15"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                    {label}
                  </button>
                );
              })}
            </div>
          </Block>

          {/* 2. Diet */}
          <Block n={2} title="Dietary restrictions">
            <Pills items={diets} selected={diet} onToggle={(v) => toggleSet(diet, v, setDiet)} />
          </Block>

          {/* 3. Allergens */}
          <Block n={3} title="Excluded allergens">
            <Pills
              items={allergens}
              selected={allergy}
              onToggle={(v) => toggleSet(allergy, v, setAllergy)}
            />
          </Block>

          {/* 4. Cuisines */}
          <Block n={4} title="Top 3 cuisines" caption="Tap to rank — first tap is #1.">
            <div className="grid grid-cols-4 gap-2">
              {cuisines.map((c) => {
                const rank = ranked.indexOf(c.id);
                const active = rank >= 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleRank(c.id)}
                    className={`relative aspect-square rounded-2xl border p-2 flex flex-col items-center justify-center gap-1 transition ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-black/[0.06] bg-card hover:border-black/15"
                    }`}
                  >
                    {active && (
                      <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {rank + 1}
                      </span>
                    )}
                    <span className="text-[22px] leading-none">{c.emoji}</span>
                    <span className="text-[9px] font-medium text-foreground/80 text-center leading-tight">
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Block>

          {/* 5. Budget */}
          <Block n={5} title="Average lunch budget">
            <div className="rounded-2xl bg-card border border-black/[0.04] p-5 shadow-soft">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[34px] leading-none tracking-tight">
                  {budget}
                  <span className="ml-1 text-[12px] font-sans font-medium text-muted-foreground">
                    SAR
                  </span>
                </span>
                <span className="text-[11px] text-muted-foreground">per meal</span>
              </div>
              <input
                type="range"
                min={20}
                max={120}
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value))}
                className="mt-4 w-full accent-[oklch(0.62_0.245_27)]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>20</span>
                <span>120</span>
              </div>
            </div>
          </Block>

          {/* 6. Goal */}
          <Block n={6} title="Health goal">
            <div className="space-y-2">
              {goals.map((g) => {
                const active = goal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-black/[0.06] bg-card hover:border-black/15"
                    }`}
                  >
                    <div>
                      <div className="text-[14px] font-semibold">{g.label}</div>
                      <div className="text-[11px] text-muted-foreground">{g.sub}</div>
                    </div>
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          </Block>

          {/* 7. City */}
          <Block n={7} title="Your city">
            <label className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-card px-4 py-3.5 focus-within:border-primary transition">
              <MapPin className="h-4 w-4 text-primary" strokeWidth={2.2} />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Riyadh"
                className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-muted-foreground"
              />
            </label>
          </Block>
        </main>

        {/* CTA */}
        <div className="sticky bottom-0 left-0 right-0 px-6 pb-6 pt-4 bg-gradient-to-t from-background via-background to-transparent">
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] active:scale-[0.99] transition"
          >
            Generate My Daily Choices
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Block({
  n,
  title,
  caption,
  children,
}: {
  n: number;
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {n}
        </span>
        <h2 className="font-display text-[22px] tracking-tight">{title}</h2>
      </div>
      {caption && <p className="mt-1 ml-8 text-[11px] text-muted-foreground">{caption}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Pills({
  items,
  selected,
  onToggle,
}: {
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = selected.includes(it);
        return (
          <button
            key={it}
            onClick={() => onToggle(it)}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-black/[0.08] bg-card text-foreground hover:border-black/20"
            }`}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}
