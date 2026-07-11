import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Headphones, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Calibrate your Fylo engine" },
      {
        name: "description",
        content:
          "A quick step-by-step calibration that teaches Fylo your goals, diet, allergies, budget and cuisines.",
      },
    ],
  }),
  component: Onboarding,
});

type Step = 1 | 2 | 3 | 4 | 5 | 6;
const TOTAL_VISIBLE_STEPS = 5;

const goals = [
  { id: "healthy", label: "Eat healthy", sub: "Here to make it easier to eat healthier", emoji: "😋" },
  { id: "lose", label: "Lose Weight", sub: "Safe and healthy rate of weight loss", emoji: "🏃‍♂️" },
  { id: "gain", label: "Gain Muscle", sub: "Gain strength while minimizing fat gain", emoji: "🏋️" },
  { id: "maintain", label: "Maintain Weight", sub: "Stay in shape with the right calories", emoji: "🧘" },
];

const diets = [
  {
    id: "balanced",
    label: "Balanced",
    sub: "Standard, well-rounded macros",
    badge: "Recommended",
    macros: [
      { l: "20-35%", n: "Protein", v: 28 },
      { l: "40-55%", n: "Carbs", v: 48 },
      { l: "20-30%", n: "Fat", v: 24 },
    ],
  },
  {
    id: "lowcarb",
    label: "Low-Carb",
    sub: "Low in carbs, high in healthy fats",
    macros: [
      { l: "25-35%", n: "Protein", v: 30 },
      { l: "10-20%", n: "Carbs", v: 15 },
      { l: "40-50%", n: "Fat", v: 45 },
    ],
  },
  {
    id: "highprotein",
    label: "High Protein",
    sub: "Boosts muscle strength and vitality",
    macros: [
      { l: "40-50%", n: "Protein", v: 45 },
      { l: "35-40%", n: "Carbs", v: 37 },
      { l: "10-25%", n: "Fat", v: 18 },
    ],
  },
  {
    id: "veg",
    label: "Vegetarian",
    sub: "Plant-based dishes with colorful veggies",
    macros: [
      { l: "15-25%", n: "Protein", v: 20 },
      { l: "45-55%", n: "Carbs", v: 50 },
      { l: "20-30%", n: "Fat", v: 25 },
    ],
  },
];

const allergens = [
  { id: "eggs", label: "Eggs", emoji: "🥚" },
  { id: "dairy", label: "Dairy", emoji: "🥛" },
  { id: "soy", label: "Soy", emoji: "🌱" },
  { id: "peanut", label: "Peanut", emoji: "🥜" },
  { id: "tree", label: "Tree Nuts", emoji: "🌰" },
  { id: "fish", label: "Fish", emoji: "🐟" },
  { id: "shell", label: "Shellfish", emoji: "🍤" },
  { id: "wheat", label: "Wheat", emoji: "🌾" },
];

const budgets = [
  { id: "value", label: "Value-focused", sub: "Under 35 SAR", emoji: "💸" },
  { id: "std", label: "Standard", sub: "35 – 65 SAR", emoji: "🍱" },
  { id: "premium", label: "Premium Gourmet", sub: "65+ SAR", emoji: "✨" },
];

const cuisines = [
  { id: "ar", label: "Arabic / Shawarma", emoji: "🥙" },
  { id: "hl", label: "Healthy / Salads", emoji: "🥗" },
  { id: "it", label: "Italian / Pasta", emoji: "🍝" },
  { id: "us", label: "American / Burgers", emoji: "🍔" },
  { id: "as", label: "Asian / Sushi", emoji: "🍣" },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [goal, setGoal] = useState<string | null>(null);
  const [diet, setDiet] = useState<string | null>(null);
  const [hasAllergy, setHasAllergy] = useState<"yes" | "no" | null>(null);
  const [allergyList, setAllergyList] = useState<string[]>([]);
  const [budget, setBudget] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const phone = params.get("phone");
    if (phone) {
      localStorage.setItem("userPhone", phone);
    }
  }, []);

  const totalSteps = hasAllergy === "yes" ? 6 : 5;
  const visibleIndex = (() => {
    if (step <= 2) return step;
    if (step === 3) return 3;
    if (step === 4) return hasAllergy === "yes" ? 4 : 4; // budget
    if (step === 5) return hasAllergy === "yes" ? 5 : 5; // cuisines
    return step;
  })();

  const next = () => setStep((s) => (s + 1) as Step);
  const back = () => {
    if (step <= 1) {
      navigate({ to: "/welcome" });
      return;
    }
    // when going back from step 4, skip the conditional allergen list if no
    if (step === 4 && hasAllergy === "no") setStep(3);
    else setStep((s) => (s - 1) as Step);
  };

  const pickGoal = (id: string) => {
    setGoal(id);
    setTimeout(next, 180);
  };
  const pickDiet = (id: string) => {
    setDiet(id);
    setTimeout(next, 180);
  };
  const pickAllergyAnswer = (v: "yes" | "no") => {
    setHasAllergy(v);
    setTimeout(() => {
      if (v === "no") {
        // skip allergen list -> go to budget
        setStep(4);
      } else {
        next();
      }
    }, 180);
  };
  const pickBudget = (id: string) => {
    setBudget(id);
    setTimeout(next, 180);
  };
  const toggleAllergen = (id: string) =>
    setAllergyList((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const toggleCuisine = (id: string) =>
    setPicked((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const finish = () => {
    setProcessing(true);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("fylo:onboarded", "1");
        localStorage.setItem(
          "fylo:prefs",
          JSON.stringify({
            goal,
            diet,
            budget,
            cuisines: picked,
            allergens: hasAllergy === "yes" ? allergyList : [],
          }),
        );
        // Clear any prior selected lunch so ranked picks show fresh.
        localStorage.removeItem("fylo:lunchOrdered");
        window.dispatchEvent(new Event("fylo:lunchOrdered"));
      }
      navigate({ to: "/" });
    }, 2200);
  };

  // Map current internal step to the visible page number (1..TOTAL_VISIBLE_STEPS)
  const pageLabel = (() => {
    const s = step as number;
    if (s <= 2) return s;
    if (s === 3) return 3;
    if (s === 4) return hasAllergy === "yes" ? 3 : 4;
    if (s === 5) return hasAllergy === "yes" ? 4 : 5;
    return 5;
  })();

  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10">
      <div className="mx-auto w-full max-w-[420px] min-h-screen md:min-h-0 md:h-[844px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative flex flex-col">
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-6">
          <button
            type="button"
            onClick={back}
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground/80 active:scale-95 transition"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(pageLabel / TOTAL_VISIBLE_STEPS) * 100}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            aria-label="Help"
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground/80"
          >
            <Headphones className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* Step body */}
        <div key={step} className="flex-1 flex flex-col px-6 pt-8 pb-6 animate-in fade-in slide-in-from-right-2 duration-300">
          {step === 1 && (
            <StepBlock title="What's your goal?">
              <div className="space-y-3 mt-2">
                {goals.map((g) => (
                  <OptionCard
                    key={g.id}
                    active={goal === g.id}
                    onClick={() => pickGoal(g.id)}
                    title={g.label}
                    sub={g.sub}
                    emoji={g.emoji}
                  />
                ))}
              </div>
            </StepBlock>
          )}

          {step === 2 && (
            <StepBlock title="Dietary Preferences" subtitle="Pick the style that fits how you eat.">
              <div className="space-y-3 mt-2">
                {diets.map((d) => {
                  const active = diet === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => pickDiet(d.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition ${
                        active
                          ? "border-primary bg-blush/40 shadow-[0_8px_24px_-12px_oklch(0.62_0.245_27/0.35)]"
                          : "border-black/[0.06] bg-card hover:border-black/15"
                      }`}
                    >
                      {d.badge && (
                        <span className="inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {d.badge}
                        </span>
                      )}
                      <div className="mt-1.5 text-[17px] font-semibold tracking-tight">{d.label}</div>
                      <div className="text-[12px] text-muted-foreground">{d.sub}</div>
                      <MacroBar macros={d.macros} />
                    </button>
                  );
                })}
              </div>
            </StepBlock>
          )}

          {step === 3 && (
            <StepBlock title="Do you have any food allergies?">
              <div className="space-y-3 mt-2">
                <OptionCard
                  active={hasAllergy === "yes"}
                  onClick={() => pickAllergyAnswer("yes")}
                  title="Yes"
                  emoji="👍"
                />
                <OptionCard
                  active={hasAllergy === "no"}
                  onClick={() => pickAllergyAnswer("no")}
                  title="No"
                  emoji="👎"
                />
              </div>
            </StepBlock>
          )}

          {step === 4 && hasAllergy === "yes" && (
            <StepBlock title="Are you allergic to anything below?">
              <div className="mt-2 flex flex-wrap gap-2.5">
                {allergens.map((a) => {
                  const active = allergyList.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAllergen(a.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-medium transition ${
                        active
                          ? "border-primary text-primary bg-blush/40"
                          : "border-black/[0.08] text-foreground bg-card hover:border-black/20"
                      }`}
                    >
                      <span className="text-[15px] leading-none">{a.emoji}</span>
                      {a.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-auto pt-8">
                <PrimaryButton onClick={next}>Continue</PrimaryButton>
              </div>
            </StepBlock>
          )}

          {((step === 4 && hasAllergy === "no") || step === 5) && step !== 5 && (
            // No-op placeholder branch (kept for clarity)
            <></>
          )}

          {step === 4 && hasAllergy !== "yes" && (
            // budget when no allergens
            <BudgetStep budget={budget} pick={pickBudget} />
          )}

          {step === 5 && hasAllergy !== "yes" && (
            <CuisineStep picked={picked} toggle={toggleCuisine} onContinue={finish} />
          )}

          {step === 5 && hasAllergy === "yes" && (
            <BudgetStep budget={budget} pick={pickBudget} />
          )}

          {step === 6 && (
            <CuisineStep picked={picked} toggle={toggleCuisine} onContinue={finish} />
          )}
        </div>

        {processing && <ProcessingOverlay />}
      </div>
    </div>
  );
}

function StepBlock({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1">
      <h1 className="font-display text-[32px] leading-[1.1] tracking-tight">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-[13px] text-muted-foreground">{subtitle}</p>
      )}
      <div className="flex-1 flex flex-col mt-5">{children}</div>
    </div>
  );
}

function OptionCard({
  active,
  onClick,
  title,
  sub,
  emoji,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub?: string;
  emoji: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-4 rounded-2xl border p-5 text-left transition ${
        active
          ? "border-primary bg-blush/40 shadow-[0_8px_24px_-12px_oklch(0.62_0.245_27/0.35)]"
          : "border-black/[0.06] bg-card hover:border-black/15"
      }`}
    >
      <div className="min-w-0">
        <div className="text-[17px] font-semibold tracking-tight">{title}</div>
        {sub && <div className="mt-0.5 text-[12.5px] text-muted-foreground">{sub}</div>}
      </div>
      <span className="text-[26px] leading-none shrink-0">{emoji}</span>
    </button>
  );
}

function MacroBar({ macros }: { macros: { l: string; n: string; v: number }[] }) {
  const total = macros.reduce((s, m) => s + m.v, 0);
  const colors = ["bg-primary", "bg-blush", "bg-foreground/30"];
  return (
    <div className="mt-4">
      <div className="flex h-2 w-full overflow-hidden rounded-full gap-1">
        {macros.map((m, i) => (
          <div
            key={m.n}
            className={`${colors[i]} rounded-full`}
            style={{ width: `${(m.v / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {macros.map((m) => (
          <div key={m.n}>
            <div className="text-[13px] font-semibold">{m.l}</div>
            <div className="text-[10.5px] text-muted-foreground">{m.n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetStep({
  budget,
  pick,
}: {
  budget: string | null;
  pick: (id: string) => void;
}) {
  return (
    <StepBlock title="What's your lunch budget?" subtitle="We tune picks to match your spend.">
      <div className="space-y-3 mt-2">
        {budgets.map((b) => (
          <OptionCard
            key={b.id}
            active={budget === b.id}
            onClick={() => pick(b.id)}
            title={b.label}
            sub={b.sub}
            emoji={b.emoji}
          />
        ))}
      </div>
    </StepBlock>
  );
}

function CuisineStep({
  picked,
  toggle,
  onContinue,
}: {
  picked: string[];
  toggle: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <StepBlock
      title="Select your favorite cuisines"
      subtitle="We rank these higher in your daily recommendations."
    >
      <div className="mt-2 grid grid-cols-2 gap-3">
        {cuisines.map((c) => {
          const active = picked.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-4 text-left transition ${
                active
                  ? "border-primary bg-blush/40"
                  : "border-black/[0.06] bg-card hover:border-black/15"
              }`}
            >
              <span className="text-[22px] leading-none">{c.emoji}</span>
              <span className="text-[13px] font-semibold leading-tight">{c.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onContinue} disabled={picked.length === 0}>
          Continue
        </PrimaryButton>
      </div>
    </StepBlock>
  );
}

function PrimaryButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] disabled:opacity-40 active:scale-[0.99] transition"
    >
      {children}
      <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}

function ProcessingOverlay() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const i = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm px-8 text-center animate-in fade-in duration-300">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-2 border-blush" />
        <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-primary" strokeWidth={2.4} />
      </div>
      <div>
        <div className="font-display text-[22px] tracking-tight leading-tight">
          Running weighting algorithm
        </div>
        <div className="mt-1 text-[13px] text-muted-foreground">
          against 40+ local restaurant menus{dots}
        </div>
      </div>
    </div>
  );
}
