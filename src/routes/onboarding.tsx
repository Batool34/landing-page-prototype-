import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Phone, MapPin, Loader2 } from "lucide-react";
import { captureUserLocation, type CapturedLocation } from "@/lib/geocode";
import {
  getOnboardingDishes,
  getOnboardingPairs,
  getMealById,
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
import { useLocale } from "@/lib/i18n/locale";
import { getMealName } from "@/lib/i18n/meals-ar";

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

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
const TOTAL_VISIBLE_STEPS = 10;
const BUDGET_MIN_SAR = 30;
const BUDGET_MAX_SAR = 300;

function budgetIdFromRange(min: number, max: number): BudgetId {
  const mid = (min + max) / 2;
  if (max <= 50) return "value";
  if (max <= 120) return "std";
  return "premium";
}

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

function pairChoice(
  mealId: string,
  signal: PairSignal,
): PairChoice | null {
  const m = getMealById(mealId);
  if (!m) return null;
  return {
    id: m.id,
    name: `${m.restaurant} · ${m.name}`,
    image: m.image,
    signal: {
      ...signal,
      cuisine: signal.cuisine ?? m.cuisine,
      proteinFocus: signal.proteinFocus ?? m.proteinFocus,
      flavor: signal.flavor ?? m.flavor,
      style: signal.style ?? m.style,
    },
  };
}

function buildForcedPairs(): { id: string; left: PairChoice; right: PairChoice }[] {
  const ids = getOnboardingPairs();
  const specs = [
    {
      id: "pair-1",
      leftId: ids.pair1.left,
      rightId: ids.pair1.right,
      leftSignal: { proteinFocus: "chicken" as ProteinFocus, style: "fried" as StyleId, cuisine: "ar" as CuisineId, flavor: "mild" as FlavorId },
      rightSignal: { proteinFocus: "chicken" as ProteinFocus, style: "baked" as StyleId, cuisine: "it" as CuisineId, flavor: "rich" as FlavorId },
    },
    {
      id: "pair-2",
      leftId: ids.pair2.left,
      rightId: ids.pair2.right,
      leftSignal: { flavor: "spicy" as FlavorId, proteinFocus: "chicken" as ProteinFocus, style: "grilled" as StyleId, cuisine: "ar" as CuisineId },
      rightSignal: { flavor: "fresh" as FlavorId, proteinFocus: "veg" as ProteinFocus, cuisine: "ar" as CuisineId, style: "fried" as StyleId },
    },
    {
      id: "pair-3",
      leftId: ids.pair3.left,
      rightId: ids.pair3.right,
      leftSignal: { flavor: "rich" as FlavorId, proteinFocus: "beef" as ProteinFocus, cuisine: "us" as CuisineId, style: "grilled" as StyleId },
      rightSignal: { flavor: "fresh" as FlavorId, proteinFocus: "chicken" as ProteinFocus, cuisine: "hl" as CuisineId, style: "raw" as StyleId },
    },
  ];
  const out: { id: string; left: PairChoice; right: PairChoice }[] = [];
  for (const s of specs) {
    const left = pairChoice(s.leftId, s.leftSignal);
    const right = pairChoice(s.rightId, s.rightSignal);
    if (left && right) out.push({ id: s.id, left, right });
  }
  return out;
}

const forcedPairs = buildForcedPairs();

const proteins = [
  { id: "chicken", labelKey: "onboarding.protein.chicken", emoji: "🍗", subKey: "onboarding.protein.chickenSub" },
  { id: "beef", labelKey: "onboarding.protein.beef", emoji: "🥩", subKey: "onboarding.protein.beefSub" },
  { id: "lamb", labelKey: "onboarding.protein.lamb", emoji: "🍖", subKey: "onboarding.protein.lambSub" },
  { id: "seafood", labelKey: "onboarding.protein.seafood", emoji: "🍤", subKey: "onboarding.protein.seafoodSub" },
  { id: "veg", labelKey: "onboarding.protein.veg", emoji: "🥬", subKey: "onboarding.protein.vegSub" },
] as const;
type ProteinId = (typeof proteins)[number]["id"];

const portions = [
  {
    id: "full",
    labelKey: "onboarding.portion.full",
    subKey: "onboarding.portion.fullSub",
    emoji: "🍽️",
  },
  {
    id: "enough",
    labelKey: "onboarding.portion.enough",
    subKey: "onboarding.portion.enoughSub",
    emoji: "🥗",
  },
  {
    id: "light",
    labelKey: "onboarding.portion.light",
    subKey: "onboarding.portion.lightSub",
    emoji: "🍃",
  },
] as const;
type PortionId = (typeof portions)[number]["id"];

const allergens = [
  { id: "eggs", labelKey: "onboarding.allergy.eggs", emoji: "🥚" },
  { id: "dairy", labelKey: "onboarding.allergy.dairy", emoji: "🥛" },
  { id: "soy", labelKey: "onboarding.allergy.soy", emoji: "🌱" },
  { id: "peanut", labelKey: "onboarding.allergy.peanut", emoji: "🥜" },
  { id: "tree", labelKey: "onboarding.allergy.tree", emoji: "🌰" },
  { id: "fish", labelKey: "onboarding.allergy.fish", emoji: "🐟" },
  { id: "shell", labelKey: "onboarding.allergy.shell", emoji: "🍤" },
  { id: "wheat", labelKey: "onboarding.allergy.wheat", emoji: "🌾" },
  { id: "other", labelKey: "onboarding.allergy.other", emoji: "✍️" },
];

function derivePrefs(input: {
  dishPicks: string[];
  pairPicks: PairChoice[];
  proteinPrefs: ProteinId[];
  portion: PortionId | null;
  budgetMax: number;
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
    budget: budgetIdFromRange(BUDGET_MIN_SAR, input.budgetMax),
    proteins: Array.from(proteinSet),
    flavors: Array.from(flavorSet),
    styles: Array.from(styleSet),
    dishPicks: input.dishPicks,
  };
}

function Onboarding() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [budgetMax, setBudgetMax] = useState(80);
  const [pickedDishes, setPickedDishes] = useState<string[]>([]);
  const [pairAnswers, setPairAnswers] = useState<Record<string, PairChoice>>({});
  const [proteinPrefs, setProteinPrefs] = useState<ProteinId[]>([]);
  const [portion, setPortion] = useState<PortionId | null>(null);
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
      navigate({ to: "/home" });
      return;
    }
    // Skip back over allergen chip list if user said "no".
    if (step === 10 && hasAllergy !== "yes") {
      setStep(9);
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

  const locateMe = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const captured = await captureUserLocation();
      setLocation(captured);
      logEvent("onboarding_location_captured", {
        city: captured.city,
        district: captured.district,
        geo: captured.geo,
      });
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? (err as GeolocationPositionError).code : null;
      if (code === 1) setLocationError(t("onboarding.location.errorDenied"));
      else if (code === 2 || code === 3) setLocationError(t("onboarding.location.errorGps"));
      else setLocationError(t("onboarding.location.errorGeneric"));
    } finally {
      setLocating(false);
    }
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
          budgetMax,
        });

        localStorage.setItem("fylo:onboarded", "1");
        localStorage.setItem("userPhone", phone);
        const visitorId = localStorage.getItem("fylo:visitorId");
        const attributionRaw = localStorage.getItem("fylo:attribution");
        const attribution = attributionRaw ? JSON.parse(attributionRaw) : null;

        localStorage.setItem(
          "fylo:prefs",
          JSON.stringify({
            phone,
            name: displayName.trim(),
            location: location
              ? {
                  city: location.city,
                  district: location.district,
                  capturedAt: new Date().toISOString(),
                  geo: location.geo,
                }
              : null,
            budgetMin: BUDGET_MIN_SAR,
            budgetMax,
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
        logEvent("onboarding_completed", {
          phone,
          name: displayName.trim(),
          city: location?.city,
          district: location?.district,
          geo: location?.geo,
          budgetMin: BUDGET_MIN_SAR,
          budgetMax,
        });
      }
      navigate({ to: "/lunches" });
    }, 2200);
  };

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
            aria-label={t("onboarding.back")}
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground/80 active:scale-95 transition"
          >
            <ArrowLeft className="h-4 w-4 rtl-flip" strokeWidth={2.2} />
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
            <NameStep name={displayName} setName={setDisplayName} onContinue={next} />
          )}

          {step === 3 && (
            <LocationStep
              city={location?.city ?? null}
              district={location?.district ?? null}
              locating={locating}
              error={locationError}
              onLocate={locateMe}
              onContinue={next}
            />
          )}

          {step === 4 && (
            <BudgetMaxStep max={budgetMax} setMax={setBudgetMax} onContinue={next} />
          )}

          {step === 5 && (
            <DishPickerStep
              picked={pickedDishes}
              toggle={toggleDish}
              onContinue={next}
            />
          )}

          {step === 6 && (
            <ForcedChoiceStep
              answers={pairAnswers}
              onPick={answerPair}
              onContinue={next}
            />
          )}

          {step === 7 && (
            <ProteinStep
              picked={proteinPrefs}
              toggle={toggleProtein}
              onContinue={next}
            />
          )}

          {step === 8 && <PortionStep portion={portion} pick={pickPortion} />}

          {step === 9 && (
            <StepBlock title={t("onboarding.allergy.title")}>
              <div className="space-y-3 mt-2">
                <OptionCard
                  active={hasAllergy === "no"}
                  onClick={() => pickAllergyAnswer("no")}
                  title={t("onboarding.allergy.no")}
                  emoji="✅"
                />
                <OptionCard
                  active={hasAllergy === "yes"}
                  onClick={() => pickAllergyAnswer("yes")}
                  title={t("onboarding.allergy.yes")}
                  emoji="⚠️"
                />
              </div>
            </StepBlock>
          )}

          {step === 10 && (
            <StepBlock
              title={t("onboarding.allergy.listTitle")}
              subtitle={t("onboarding.allergy.listSubtitle")}
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
                      {t(a.labelKey)}
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
                    {t("onboarding.allergy.otherLabel")}
                  </label>
                  <input
                    id="allergy-other"
                    type="text"
                    value={allergyOther}
                    onChange={(e) => setAllergyOther(e.target.value)}
                    placeholder={t("onboarding.allergy.otherPlaceholder")}
                    className="mt-1.5 w-full rounded-2xl border border-black/[0.08] bg-card px-4 py-3.5 text-[15px] font-medium outline-none focus:border-primary transition text-start"
                    autoFocus
                  />
                </div>
              )}

              <div className="mt-auto pt-8">
                <PrimaryButton onClick={() => finish("yes", allergyList)}>
                  {t("onboarding.generate")}
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
      className={`w-full flex items-center justify-between gap-4 rounded-2xl border p-5 text-start transition ${
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

function NameStep({
  name,
  setName,
  onContinue,
}: {
  name: string;
  setName: (v: string) => void;
  onContinue: () => void;
}) {
  const { t } = useLocale();
  const valid = name.trim().length >= 2;
  return (
    <StepBlock title={t("onboarding.name.title")} subtitle={t("onboarding.name.subtitle")}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("onboarding.name.placeholder")}
        className="mt-2 w-full rounded-2xl border border-black/[0.08] bg-card px-4 py-4 text-[17px] font-semibold outline-none focus:border-primary transition text-start"
        autoFocus
        autoComplete="name"
      />
      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onContinue} disabled={!valid}>
          {t("onboarding.continue")}
        </PrimaryButton>
      </div>
    </StepBlock>
  );
}

function LocationStep({
  city,
  district,
  locating,
  error,
  onLocate,
  onContinue,
}: {
  city: string | null;
  district: string | null;
  locating: boolean;
  error: string | null;
  onLocate: () => void;
  onContinue: () => void;
}) {
  const { t } = useLocale();
  const detectedLabel =
    city && district
      ? t("onboarding.location.detectedCityDistrict", { city, district })
      : city
        ? t("onboarding.location.detectedCity", { city })
        : null;
  return (
    <StepBlock title={t("onboarding.location.title")} subtitle={t("onboarding.location.subtitle")}>
      <button
        type="button"
        onClick={onLocate}
        disabled={locating}
        className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-black/[0.08] bg-card px-4 py-4 text-start transition hover:border-primary/40 disabled:opacity-60"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{t("onboarding.location.cta")}</span>
          <span className="block text-[12px] text-muted-foreground mt-0.5">
            {detectedLabel ?? t("onboarding.location.hint")}
          </span>
        </span>
      </button>
      {error && <p className="mt-2 text-[12px] text-destructive">{error}</p>}
      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onContinue} disabled={!city}>
          {t("onboarding.continue")}
        </PrimaryButton>
      </div>
    </StepBlock>
  );
}

function BudgetMaxStep({
  max,
  setMax,
  onContinue,
}: {
  max: number;
  setMax: (n: number) => void;
  onContinue: () => void;
}) {
  const { t } = useLocale();
  const clampMax = (v: number) => Math.max(Math.min(BUDGET_MAX_SAR, v), BUDGET_MIN_SAR);

  return (
    <StepBlock title={t("onboarding.budget.title")} subtitle={t("onboarding.budget.subtitle")}>
      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-card p-5">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("onboarding.budget.maxLabel")}
          </div>
          <div className="font-display text-[36px] text-primary leading-none mt-2 tabular-nums">
            {max} <span className="text-[18px]">{t("common.sar")}</span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{t("onboarding.budget.floorHint")}</p>
        </div>

        <input
          type="range"
          min={BUDGET_MIN_SAR}
          max={BUDGET_MAX_SAR}
          step={5}
          value={max}
          onChange={(e) => setMax(clampMax(Number(e.target.value)))}
          className="mt-6 w-full accent-primary"
          aria-label={t("onboarding.budget.maxLabel")}
        />
        <div className="mt-3 flex justify-between text-[10px] text-muted-foreground tabular-nums">
          <span>{BUDGET_MIN_SAR}</span>
          <span>{BUDGET_MAX_SAR}</span>
        </div>
      </div>
      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onContinue}>
          {t("onboarding.continue")}
        </PrimaryButton>
      </div>
    </StepBlock>
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
  const { t } = useLocale();
  const digits = phone.replace(/\D/g, "");
  const isValid = digits.length >= 9;
  return (
    <StepBlock
      title={t("onboarding.phone.title")}
      subtitle={t("onboarding.phone.subtitle")}
    >
      <div className="mt-2 flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-card px-4 py-4 focus-within:border-primary transition">
          <Phone className="h-5 w-5 text-foreground/60" strokeWidth={2} />
          <span className="text-[15px] font-semibold text-foreground/80">{t("onboarding.phone.prefix")}</span>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("onboarding.phone.placeholder")}
            className="flex-1 bg-transparent text-[17px] font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50 text-start"
            autoFocus
          />
        </div>
        <p className="text-[12px] text-muted-foreground">
          {t("onboarding.phone.privacy")}
        </p>
      </div>
      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onContinue} disabled={!isValid}>
          {t("onboarding.continue")}
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
  const { t, locale } = useLocale();
  const remaining = Math.max(0, 5 - picked.length);
  const ready = picked.length >= 3;
  return (
    <StepBlock
      title={t("onboarding.dishes.title")}
      subtitle={
        remaining > 0
          ? t("onboarding.dishes.subtitleMore", { remaining })
          : t("onboarding.dishes.subtitleDone")
      }
    >
      <div className="mt-2 grid grid-cols-2 gap-3">
        {dishPicks.map((d) => {
          const active = picked.includes(d.id);
          const name = getMealName(d.id, locale, d.name);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => toggle(d.id)}
              className={`relative overflow-hidden rounded-2xl border text-start transition ${
                active
                  ? "border-primary shadow-[0_8px_24px_-12px_oklch(0.62_0.245_27/0.4)]"
                  : "border-black/[0.06] hover:border-black/15"
              }`}
            >
              <div className="relative aspect-square">
                <img
                  src={d.image}
                  alt={name}
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
                  {name}
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
          {ready
            ? t("onboarding.continue")
            : t("onboarding.dishes.pickMore", { n: 3 - picked.length })}
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
  const { t } = useLocale();
  const done = Object.keys(answers).length >= forcedPairs.length;
  return (
    <StepBlock
      title={t("onboarding.pairs.title")}
      subtitle={t("onboarding.pairs.subtitle")}
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
                  {t("onboarding.pairs.round", { n: idx + 1, total: forcedPairs.length })}
                </div>
                {locked ? (
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("onboarding.pairs.locked", { n: idx })}
                  </div>
                ) : chosen ? (
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {t("onboarding.pairs.selected")}
                  </div>
                ) : (
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("onboarding.pairs.pickOne")}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[pair.left, pair.right].map((choice) => {
                  const active = chosen === choice.id;
                  const dimmed = Boolean(chosen) && !active;
                  const label = choice.name;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={locked}
                      onClick={() => onPick(pair.id, choice)}
                      className={`relative overflow-hidden rounded-2xl border text-start transition ${
                        active
                          ? "border-primary shadow-[0_10px_28px_-14px_oklch(0.62_0.245_27/0.5)]"
                          : "border-black/[0.06] hover:border-black/15"
                      } ${dimmed ? "opacity-50" : ""}`}
                    >
                      <div className="relative aspect-[4/3]">
                        <img
                          src={choice.image}
                          alt={label}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        {active && (
                          <div className="absolute top-2 end-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
                            <Check className="h-4 w-4" strokeWidth={2.6} />
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2">
                        <div className="text-[13px] font-semibold leading-tight">
                          {label}
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
          {done
            ? t("onboarding.continue")
            : t("onboarding.pairs.finishRounds", { n: forcedPairs.length })}
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
  const { t } = useLocale();
  return (
    <StepBlock
      title={t("onboarding.protein.title")}
      subtitle={t("onboarding.protein.subtitle")}
    >
      <div className="mt-2 grid grid-cols-2 gap-3">
        {proteins.map((p) => {
          const active = picked.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`flex flex-col gap-1 rounded-2xl border px-4 py-4 text-start transition ${
                active
                  ? "border-primary bg-blush/40"
                  : "border-black/[0.06] bg-card hover:border-black/15"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[22px] leading-none">{p.emoji}</span>
                <span className="text-[14px] font-semibold leading-tight">{t(p.labelKey)}</span>
              </div>
              <span className="text-[11px] text-muted-foreground leading-snug ps-8">
                {t(p.subKey)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onContinue} disabled={picked.length === 0}>
          {t("onboarding.continue")}
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
  const { t } = useLocale();
  return (
    <StepBlock
      title={t("onboarding.portion.title")}
      subtitle={t("onboarding.portion.subtitle")}
    >
      <div className="space-y-3 mt-2">
        {portions.map((p) => (
          <OptionCard
            key={p.id}
            active={portion === p.id}
            onClick={() => pick(p.id)}
            title={t(p.labelKey)}
            sub={t(p.subKey)}
            emoji={p.emoji}
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
      <ArrowRight className="h-4 w-4 rtl-flip" strokeWidth={2.5} />
    </button>
  );
}

function ProcessingOverlay() {
  const { t } = useLocale();
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
          {t("onboarding.processing.title")}
        </div>
        <div className="mt-1 text-[13px] text-muted-foreground">
          {t("onboarding.processing.sub")}{dots}
        </div>
      </div>
    </div>
  );
}
