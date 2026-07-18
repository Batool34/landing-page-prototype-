import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Phone, Check } from "lucide-react";
import {
  getOnboardingDishes,
  mealPool,
  type BudgetId,
  type CuisineId,
  type DietId,
  type FlavorId,
  type GoalId,
  type ProteinFocus,
  type StyleId,
} from "@/lib/meals";
import { syncLead, logEvent } from "@/lib/tracking";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Calibrate your Picky taste engine" },
      {
        name: "description",
        content:
          "A quick taste-driven calibration: pick the dishes that make you hungry and we'll learn what you'd actually order.",
      },
    ],
  }),
  component: Onboarding,
});

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
const TOTAL_VISIBLE_STEPS = 7;

// ---------- Taste data ----------
// Real HungerStation bestsellers — picks here boost those meals in ranking.
const dishPicks = getOnboardingDishes().map((m) => ({
  id: m.id,
  name: m.name,
  restaurant: m.restaurant,
  image: m.image,
  cuisine: m.cuisine,
}));

type PairSignal = {
  proteinFocus?: ProteinFocus;
  flavor?: FlavorId;
  style?: StyleId;
  cuisine?: CuisineId;
};
type PairChoice = { id: string; name: string; image: string; signal: PairSignal };

function mealImg(id: string) {
  return mealPool.find((m) => m.id === id)?.image ?? "";
}

const forcedPairs: { id: string; left: PairChoice; right: PairChoice }[] = [
  {
    id: "pair-1",
    left: {
      id: "abk-big-baik",
      name: "Al Baik · Big Baik",
      image: mealImg("abk-big-baik"),
      signal: { proteinFocus: "chicken", style: "fried", cuisine: "ar", flavor: "mild" },
    },
    right: {
      id: "mst-alfredo-chicken",
      name: "Maestro · Alfredo Chicken Pizza",
      image: mealImg("mst-alfredo-chicken"),
      signal: { proteinFocus: "chicken", style: "baked", cuisine: "it", flavor: "rich" },
    },
  },
  {
    id: "pair-2",
    left: {
      id: "shm-raj-raj",
      name: "Shawarmer · Raj Raj",
      image: mealImg("shm-raj-raj"),
      signal: { flavor: "spicy", proteinFocus: "chicken", style: "grilled", cuisine: "ar" },
    },
    right: {
      id: "of-crispy-falafel",
      name: "Operation Falafel · Crispy Falafel",
      image: mealImg("of-crispy-falafel"),
      signal: { flavor: "fresh", proteinFocus: "veg", cuisine: "ar", style: "fried" },
    },
  },
  {
    id: "pair-3",
    left: {
      id: "cb-original",
      name: "Century · The Original CB",
      image: mealImg("cb-original"),
      signal: { flavor: "rich", proteinFocus: "beef", cuisine: "us", style: "grilled" },
    },
    right: {
      id: "kdu-chicken-salad",
      name: "Kudu · Chicken Salad",
      image: mealImg("kdu-chicken-salad"),
      signal: { flavor: "fresh", proteinFocus: "chicken", cuisine: "hl", style: "raw" },
    },
  },
];

const proteins = [
  { id: "chicken", label: "Chicken", emoji: "🍗", sub: "Shawarma, Baik, grilled" },
  { id: "beef", label: "Beef", emoji: "🥩", sub: "Burgers, steak wraps" },
  { id: "lamb", label: "Lamb", emoji: "🍖", sub: "Kabab, grills" },
  { id: "seafood", label: "Seafood", emoji: "🍤", sub: "Fish & shrimp" },
  { id: "veg", label: "Veg-forward", emoji: "🥬", sub: "Falafel, salads, pasta" },
] as const;
type ProteinId = (typeof proteins)[number]["id"];

const portions = [
  {
    id: "full",
    label: "I want to feel full",
    sub: "Bigger platters & high-kcal meals",
    emoji: "🍽️",
  },
  {
    id: "enough",
    label: "Just enough",
    sub: "Balanced plate, mid-range calories",
    emoji: "🥗",
  },
  {
    id: "light",
    label: "Light bite",
    sub: "Salads & lighter sandwiches",
    emoji: "🍃",
  },
] as const;
type PortionId = (typeof portions)[number]["id"];

const budgets = [
  { id: "value", label: "Budgeted", sub: "Prefer under 35 SAR", emoji: "💸" },
  { id: "std", label: "Standard", sub: "Usually 28 – 55 SAR", emoji: "🍱" },
  { id: "premium", label: "Premium", sub: "Happy at 32 SAR and up", emoji: "✨" },
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
  { id: "other", label: "Other", emoji: "✍️" },
];

function derivePrefs(input: {
  dishPicks: string[];
  pairPicks: PairChoice[];
  proteinPrefs: ProteinId[];
  portion: PortionId | null;
  budget: string | null;
}) {
  const cuisineSet = new Set<CuisineId>();
  const flavorSet = new Set<FlavorId>();
  const styleSet = new Set<StyleId>();
  const proteinSet = new Set<ProteinFocus>(input.proteinPrefs);

  for (const id of input.dishPicks) {
    const meal = mealPool.find((m) => m.id === id);
    if (!meal) continue;
    cuisineSet.add(meal.cuisine);
    if (meal.proteinFocus) proteinSet.add(meal.proteinFocus);
    if (meal.flavor) flavorSet.add(meal.flavor);
    if (meal.style) styleSet.add(meal.style);
  }
  for (const p of input.pairPicks) {
    if (p.signal.cuisine) cuisineSet.add(p.signal.cuisine);
    if (p.signal.flavor) flavorSet.add(p.signal.flavor);
    if (p.signal.style) styleSet.add(p.signal.style);
    if (p.signal.proteinFocus) proteinSet.add(p.signal.proteinFocus);
  }

  let diet: DietId = "balanced";
  if (input.proteinPrefs.includes("veg") && input.proteinPrefs.length === 1) {
    diet = "veg";
  } else if (
    input.proteinPrefs.some((p) => p !== "veg") &&
    input.portion !== "light"
  ) {
    diet = "highprotein";
  } else if (input.portion === "light") {
    diet = "lowcarb";
  }

  const goal: GoalId =
    input.portion === "full"
      ? "gain"
      : input.portion === "enough"
        ? "maintain"
        : input.portion === "light"
          ? "lose"
          : "healthy";

  return {
    goal,
    diet,
    cuisines: Array.from(cuisineSet),
    budget: (input.budget as BudgetId | null) ?? null,
    proteins: Array.from(proteinSet),
    flavors: Array.from(flavorSet),
    styles: Array.from(styleSet),
    dishPicks: input.dishPicks,
  };
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState("");
  const [pickedDishes, setPickedDishes] = useState<string[]>([]);
  const [pairAnswers, setPairAnswers] = useState<Record<string, PairChoice>>({});
  const [proteinPrefs, setProteinPrefs] = useState<ProteinId[]>([]);
  const [portion, setPortion] = useState<PortionId | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [hasAllergy, setHasAllergy] = useState<"yes" | "no" | null>(null);
  const [allergyList, setAllergyList] = useState<string[]>([]);
  const [allergyOther, setAllergyOther] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const phoneParam = params.get("phone");
    const source = params.get("utm_source") || params.get("src") || params.get("ref");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");

    const inboundVid = params.get("visitor_id") || params.get("vid");
    let visitorId = localStorage.getItem("fylo:visitorId");
    if (inboundVid) {
      visitorId = inboundVid;
      localStorage.setItem("fylo:visitorId", inboundVid);
    } else if (!visitorId) {
      visitorId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("fylo:visitorId", visitorId);
    }

    if (source && !localStorage.getItem("fylo:attribution")) {
      localStorage.setItem(
        "fylo:attribution",
        JSON.stringify({
          source,
          medium: utmMedium,
          campaign: utmCampaign,
          landedAt: new Date().toISOString(),
        }),
      );
    }

    if (phoneParam) {
      const digits = phoneParam.replace(/\D/g, "");
      if (digits.length >= 9) {
        localStorage.setItem("userPhone", phoneParam);
        localStorage.setItem("fylo:phoneSource", source || "landing");
        localStorage.setItem("fylo:phoneCapturedAt", new Date().toISOString());
        setPhone(phoneParam);
        setStep(2);
        return;
      }
    }
    const saved = localStorage.getItem("userPhone");
    if (saved) {
      setPhone(saved);
      setStep(2);
    }
  }, []);

  const next = () => setStep((s) => (s + 1) as Step);
  const back = () => {
    if (step <= 1) {
      navigate({ to: "/" });
      return;
    }
    // Skip back over allergen chip list if user said "no".
    if (step === 8 && hasAllergy !== "yes") {
      setStep(7);
      return;
    }
    setStep((s) => (s - 1) as Step);
  };

  const submitPhone = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) return;
    if (typeof window !== "undefined") localStorage.setItem("userPhone", phone);
    // Capture the phone/lead early — even if the user drops off before finishing.
    syncLead();
    logEvent("phone_captured", { phone });
    next();
  };

  const toggleDish = (id: string) =>
    setPickedDishes((a) => {
      if (a.includes(id)) return a.filter((x) => x !== id);
      if (a.length >= 5) return a; // cap at 5 picks
      return [...a, id];
    });

  const answerPair = (pairId: string, choice: PairChoice) => {
    setPairAnswers((p) => ({ ...p, [pairId]: choice }));
    // Auto-advance once the last pair is answered.
    const answeredCount = Object.keys({ ...pairAnswers, [pairId]: choice }).length;
    if (answeredCount >= forcedPairs.length) setTimeout(next, 220);
  };

  const toggleProtein = (id: ProteinId) =>
    setProteinPrefs((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const pickPortion = (id: PortionId) => {
    setPortion(id);
    setTimeout(next, 180);
  };

  const pickBudget = (id: string) => {
    setBudget(id);
    setTimeout(next, 180);
  };

  const pickAllergyAnswer = (v: "yes" | "no") => {
    setHasAllergy(v);
    setTimeout(() => {
      if (v === "no") finish(v, []);
      else next();
    }, 180);
  };

  const toggleAllergen = (id: string) =>
    setAllergyList((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const finish = (
    allergyChoice: "yes" | "no" | null = hasAllergy,
    allergyItems: string[] = allergyList,
  ) => {
    setProcessing(true);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        const pairPicks = Object.values(pairAnswers);
        const derived = derivePrefs({
          dishPicks: pickedDishes,
          pairPicks,
          proteinPrefs,
          portion,
          budget,
        });

        localStorage.setItem("fylo:onboarded", "1");
        localStorage.setItem("userPhone", phone);
        // Assign a waitlist position on first onboarding. Base is 119 and
        // increments for every new person who completes onboarding on this
        // device so the number keeps climbing as we collect signups.
        if (!localStorage.getItem("fylo:waitlistPosition")) {
          const counter = parseInt(
            localStorage.getItem("fylo:waitlistCounter") ?? "0",
            10,
          );
          const position = 119 + counter;
          localStorage.setItem("fylo:waitlistPosition", String(position));
          localStorage.setItem("fylo:waitlistCounter", String(counter + 1));
        }
        const visitorId = localStorage.getItem("fylo:visitorId");
        const attributionRaw = localStorage.getItem("fylo:attribution");
        const attribution = attributionRaw ? JSON.parse(attributionRaw) : null;

        localStorage.setItem(
          "fylo:prefs",
          JSON.stringify({
            phone,
            goal: derived.goal,
            diet: derived.diet,
            budget: derived.budget,
            cuisines: derived.cuisines,
            proteins: derived.proteins,
            flavors: derived.flavors,
            styles: derived.styles,
            dishPicks: derived.dishPicks,
            allergens: allergyChoice === "yes" ? allergyItems : [],
            allergenOther: allergyChoice === "yes" && allergyItems.includes("other") ? allergyOther : "",
            taste: {
              dishPicks: pickedDishes,
              pairPicks: pairPicks.map((p) => ({ id: p.id, signal: p.signal })),
              proteinPrefs,
              portion,
            },
            visitorId,
            attribution,
            completedAt: new Date().toISOString(),
          }),
        );
        localStorage.removeItem("fylo:lunchOrdered");
        window.dispatchEvent(new Event("fylo:lunchOrdered"));

        // Push everything the visitor entered up to Lovable Cloud so the
        // Picky team can see it in the backend dashboard.
        syncLead();
        logEvent("onboarding_completed", { phone });
      }
      navigate({ to: "/lunches" });
    }, 2200);
  };

  // Progress: step 1..7 map 1:1, step 8 (allergen list) stays on 7.
  const pageLabel = Math.min(step, TOTAL_VISIBLE_STEPS);

  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10 overflow-x-hidden">
      <div className="mx-auto w-full max-w-[420px] min-h-[100dvh] md:min-h-0 md:h-[844px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative flex flex-col">
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
          <div className="h-10 w-10" aria-hidden />
        </div>

        {/* Step body */}
        <div
          key={step}
          className="flex-1 flex flex-col px-6 pt-8 pb-6 animate-in fade-in slide-in-from-right-2 duration-300 overflow-y-auto"
        >
          {step === 1 && (
            <PhoneStep phone={phone} setPhone={setPhone} onContinue={submitPhone} />
          )}

          {step === 2 && (
            <DishPickerStep
              picked={pickedDishes}
              toggle={toggleDish}
              onContinue={next}
            />
          )}

          {step === 3 && (
            <ForcedChoiceStep
              answers={pairAnswers}
              onPick={answerPair}
              onContinue={next}
            />
          )}

          {step === 4 && (
            <ProteinStep
              picked={proteinPrefs}
              toggle={toggleProtein}
              onContinue={next}
            />
          )}

          {step === 5 && <PortionStep portion={portion} pick={pickPortion} />}

          {step === 6 && <BudgetStep budget={budget} pick={pickBudget} />}

          {step === 7 && (
            <StepBlock title="Any food allergies we should avoid?">
              <div className="space-y-3 mt-2">
                <OptionCard
                  active={hasAllergy === "no"}
                  onClick={() => pickAllergyAnswer("no")}
                  title="No allergies"
                  emoji="✅"
                />
                <OptionCard
                  active={hasAllergy === "yes"}
                  onClick={() => pickAllergyAnswer("yes")}
                  title="Yes, I have some"
                  emoji="⚠️"
                />
              </div>
            </StepBlock>
          )}

          {step === 8 && (
            <StepBlock
              title="What are you allergic to?"
              subtitle="We'll hard-filter these from every recommendation."
            >
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

              {allergyList.includes("other") && (
                <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label
                    htmlFor="allergy-other"
                    className="text-[13px] font-medium text-foreground"
                  >
                    Tell us what else to avoid
                  </label>
                  <input
                    id="allergy-other"
                    type="text"
                    value={allergyOther}
                    onChange={(e) => setAllergyOther(e.target.value)}
                    placeholder="e.g. sesame, mustard, mushrooms"
                    className="mt-1.5 w-full rounded-2xl border border-black/[0.08] bg-card px-4 py-3.5 text-[15px] font-medium outline-none focus:border-primary transition"
                    autoFocus
                  />
                </div>
              )}

              <div className="mt-auto pt-8">
                <PrimaryButton onClick={() => finish("yes", allergyList)}>
                  Generate My Daily Choices
                </PrimaryButton>
              </div>
            </StepBlock>
          )}
        </div>

        {processing && <ProcessingOverlay />}
      </div>
    </div>
  );
}

// ---------- Step blocks ----------

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
      {subtitle && <p className="mt-2 text-[13px] text-muted-foreground">{subtitle}</p>}
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

function PhoneStep({
  phone,
  setPhone,
  onContinue,
}: {
  phone: string;
  setPhone: (v: string) => void;
  onContinue: () => void;
}) {
  const digits = phone.replace(/\D/g, "");
  const isValid = digits.length >= 9;
  return (
    <StepBlock
      title="What's your phone number?"
      subtitle="We use this to save your picks and send order updates."
    >
      <div className="mt-2 flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-card px-4 py-4 focus-within:border-primary transition">
          <Phone className="h-5 w-5 text-foreground/60" strokeWidth={2} />
          <span className="text-[15px] font-semibold text-foreground/80">🇸🇦 +966</span>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="5X XXX XXXX"
            className="flex-1 bg-transparent text-[17px] font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
            autoFocus
          />
        </div>
        <p className="text-[12px] text-muted-foreground">
          Your number is only used to personalize your Picky experience.
        </p>
      </div>
      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onContinue} disabled={!isValid}>
          Continue
        </PrimaryButton>
      </div>
    </StepBlock>
  );
}

function DishPickerStep({
  picked,
  toggle,
  onContinue,
}: {
  picked: string[];
  toggle: (id: string) => void;
  onContinue: () => void;
}) {
  const remaining = Math.max(0, 5 - picked.length);
  const ready = picked.length >= 3;
  return (
    <StepBlock
      title="Pick dishes you'd actually order"
      subtitle={
        remaining > 0
          ? `Real Riyadh menus — Al Baik, Shawarmer, Kudu & more. ${remaining} more to go.`
          : "Nice — we'll prioritize these (and their kitchens) for you."
      }
    >
      <div className="mt-2 grid grid-cols-2 gap-3">
        {dishPicks.map((d) => {
          const active = picked.includes(d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => toggle(d.id)}
              className={`relative overflow-hidden rounded-2xl border text-left transition ${
                active
                  ? "border-primary shadow-[0_8px_24px_-12px_oklch(0.62_0.245_27/0.4)]"
                  : "border-black/[0.06] hover:border-black/15"
              }`}
            >
              <div className="relative aspect-square">
                <img
                  src={d.image}
                  alt={d.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {active && (
                  <div className="absolute inset-0 bg-primary/25 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
                      <Check className="h-5 w-5" strokeWidth={2.6} />
                    </div>
                  </div>
                )}
              </div>
              <div className="px-3 py-2">
                <div className="text-[12.5px] font-semibold leading-tight line-clamp-1">
                  {d.name}
                </div>
                <div className="text-[10.5px] text-muted-foreground line-clamp-1">
                  {d.restaurant}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-6 pb-2">
        <PrimaryButton onClick={onContinue} disabled={!ready}>
          {ready ? "Continue" : `Pick at least ${3 - picked.length} more`}
        </PrimaryButton>
      </div>
    </StepBlock>
  );
}

function ForcedChoiceStep({
  answers,
  onPick,
  onContinue,
}: {
  answers: Record<string, PairChoice>;
  onPick: (pairId: string, choice: PairChoice) => void;
  onContinue: () => void;
}) {
  const done = Object.keys(answers).length >= forcedPairs.length;
  return (
    <StepBlock
      title="If you had to choose one…"
      subtitle="Choose one meal in each round. Finish Round 1 to unlock Round 2, then Round 3."
    >
      <div className="mt-2 space-y-6">
        {forcedPairs.map((pair, idx) => {
          const chosen = answers[pair.id]?.id;
          const prevDone = idx === 0 || Boolean(answers[forcedPairs[idx - 1].id]);
          const locked = !prevDone;
          return (
            <div
              key={pair.id}
              className={locked ? "opacity-40 pointer-events-none select-none" : ""}
              aria-disabled={locked}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Round {idx + 1} of {forcedPairs.length}
                </div>
                {locked ? (
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Locked — finish Round {idx} first
                  </div>
                ) : chosen ? (
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Selected
                  </div>
                ) : (
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Pick one
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[pair.left, pair.right].map((choice) => {
                  const active = chosen === choice.id;
                  const dimmed = Boolean(chosen) && !active;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={locked}
                      onClick={() => onPick(pair.id, choice)}
                      className={`relative overflow-hidden rounded-2xl border text-left transition ${
                        active
                          ? "border-primary shadow-[0_10px_28px_-14px_oklch(0.62_0.245_27/0.5)]"
                          : "border-black/[0.06] hover:border-black/15"
                      } ${dimmed ? "opacity-50" : ""}`}
                    >
                      <div className="relative aspect-[4/3]">
                        <img
                          src={choice.image}
                          alt={choice.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        {active && (
                          <div className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
                            <Check className="h-4 w-4" strokeWidth={2.6} />
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2">
                        <div className="text-[13px] font-semibold leading-tight">
                          {choice.name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pb-2">
        <PrimaryButton onClick={onContinue} disabled={!done}>
          {done ? "Continue" : `Finish all ${forcedPairs.length} rounds`}
        </PrimaryButton>
      </div>
    </StepBlock>
  );
}

function ProteinStep({
  picked,
  toggle,
  onContinue,
}: {
  picked: ProteinId[];
  toggle: (id: ProteinId) => void;
  onContinue: () => void;
}) {
  return (
    <StepBlock
      title="Which proteins do you crave?"
      subtitle="We'll hard-filter veg-only if that's all you pick — otherwise we boost your picks."
    >
      <div className="mt-2 grid grid-cols-2 gap-3">
        {proteins.map((p) => {
          const active = picked.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`flex flex-col gap-1 rounded-2xl border px-4 py-4 text-left transition ${
                active
                  ? "border-primary bg-blush/40"
                  : "border-black/[0.06] bg-card hover:border-black/15"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[22px] leading-none">{p.emoji}</span>
                <span className="text-[14px] font-semibold leading-tight">{p.label}</span>
              </div>
              <span className="text-[11px] text-muted-foreground leading-snug pl-8">
                {p.sub}
              </span>
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

function PortionStep({
  portion,
  pick,
}: {
  portion: PortionId | null;
  pick: (id: PortionId) => void;
}) {
  return (
    <StepBlock
      title="How hungry is lunch usually?"
      subtitle="Sets the portion size we recommend."
    >
      <div className="space-y-3 mt-2">
        {portions.map((p) => (
          <OptionCard
            key={p.id}
            active={portion === p.id}
            onClick={() => pick(p.id)}
            title={p.label}
            sub={p.sub}
            emoji={p.emoji}
          />
        ))}
      </div>
    </StepBlock>
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
    <StepBlock
      title="What's your lunch budget?"
      subtitle="We hard-filter meals outside your band, then rank what fits."
    >
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
          Matching your taste profile
        </div>
        <div className="mt-1 text-[13px] text-muted-foreground">
          against 40+ local restaurant menus{dots}
        </div>
      </div>
    </div>
  );
}
