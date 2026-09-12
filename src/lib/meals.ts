import catalog from "@/generated/meal-catalog.json";

// Onboarding vocabularies (kept in sync with src/routes/onboarding.tsx)
export type GoalId = "healthy" | "lose" | "gain" | "maintain";
export type DietId = "balanced" | "lowcarb" | "highprotein" | "veg";
export type BudgetId = "value" | "std" | "premium";
export type CuisineId = "ar" | "hl" | "it" | "us" | "as";
export type AllergenId =
  | "eggs" | "dairy" | "soy" | "peanut" | "tree" | "fish" | "shell" | "wheat";
/** Taste signals collected in onboarding and used by the ranking engine. */
export type ProteinFocus = "chicken" | "beef" | "lamb" | "seafood" | "veg";
export type FlavorId = "spicy" | "mild" | "rich" | "fresh";
export type StyleId = "grilled" | "fried" | "baked" | "raw";

export type Meal = {
  id: string;
  slot: string;
  name: string;
  restaurant: string;
  restaurantSlug: string;
  category?: string;
  description?: string;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  image: string;
  tag?: string;
  basePrice: number | null;
  cuisine: CuisineId;
  goals: GoalId[];
  diets: DietId[];
  allergens: AllergenId[];
  proteinFocus?: ProteinFocus;
  flavor?: FlavorId;
  style?: StyleId;
  etaLo?: number | null;
  etaHi?: number | null;
  sourceUrl?: string;
};

type CatalogFile = {
  restaurantCount: number;
  onboardingDishIds: string[];
  onboardingPairs: {
    pair1: { left: string; right: string };
    pair2: { left: string; right: string };
    pair3: { left: string; right: string };
  };
  meals: Meal[];
};

const data = catalog as CatalogFile;

export const restaurantCount = data.restaurantCount;
export const mealPool: Meal[] = data.meals;
export const meals = mealPool.slice(0, 5);

/** Meals shown per day in the lunches UI (ranked subset of the full catalog). */
export const MEALS_PER_DAY_VIEW = 40;

export const ONBOARDING_DISH_IDS = data.onboardingDishIds;

export function getOnboardingDishes(): Meal[] {
  return ONBOARDING_DISH_IDS.map((id) => mealPool.find((m) => m.id === id)).filter(
    (m): m is Meal => Boolean(m),
  );
}

export function getOnboardingPairs() {
  return data.onboardingPairs;
}

// ---- Onboarding prefs (persisted from src/routes/onboarding.tsx) ----
export type Prefs = {
  goal: GoalId | null;
  diet: DietId | null;
  budget: BudgetId | null;
  cuisines: CuisineId[];
  allergens: AllergenId[];
  proteins: ProteinFocus[];
  flavors: FlavorId[];
  styles: StyleId[];
  dishPicks: string[];
};

export function readPrefs(): Prefs {
  const empty: Prefs = {
    goal: null,
    diet: null,
    budget: null,
    cuisines: [],
    allergens: [],
    proteins: [],
    flavors: [],
    styles: [],
    dishPicks: [],
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem("fylo:prefs");
    if (!raw) return empty;
    const p = JSON.parse(raw);
    const taste = p.taste ?? {};
    const proteins: ProteinFocus[] = Array.isArray(p.proteins)
      ? p.proteins
      : Array.isArray(taste.proteinPrefs)
        ? taste.proteinPrefs
        : [];
    const flavors: FlavorId[] = Array.isArray(p.flavors)
      ? p.flavors
      : (taste.pairPicks ?? [])
          .map((x: { signal?: { flavor?: FlavorId } }) => x?.signal?.flavor)
          .filter(Boolean);
    const styles: StyleId[] = Array.isArray(p.styles)
      ? p.styles
      : (taste.pairPicks ?? [])
          .map((x: { signal?: { style?: StyleId } }) => x?.signal?.style)
          .filter(Boolean);
    const dishPicks: string[] = Array.isArray(p.dishPicks)
      ? p.dishPicks
      : Array.isArray(taste.dishPicks)
        ? taste.dishPicks
        : [];
    return {
      ...empty,
      goal: p.goal ?? null,
      diet: p.diet ?? null,
      budget: p.budget ?? null,
      cuisines: p.cuisines ?? [],
      allergens: (p.allergens ?? []).filter((a: string) => a !== "other"),
      proteins,
      flavors: [...new Set(flavors)],
      styles: [...new Set(styles)],
      dishPicks,
    };
  } catch {
    return empty;
  }
}

function tasteOf(m: Meal): {
  proteinFocus: ProteinFocus;
  flavor: FlavorId;
  style: StyleId;
} {
  if (m.proteinFocus && m.flavor && m.style) {
    return { proteinFocus: m.proteinFocus, flavor: m.flavor, style: m.style };
  }
  const n = `${m.name} ${m.restaurant}`.toLowerCase();
  let proteinFocus: ProteinFocus = "chicken";
  if (/falafel|veg|salad|margarita|margherita|pasta/.test(n) && !/chicken|beef|meat|shawarma|burger|kabab|tikka/.test(n))
    proteinFocus = "veg";
  else if (/beef|steak|herfy|pepperoni|big mac|cb\b|century/.test(n)) proteinFocus = "beef";
  else if (/lamb|halabi/.test(n)) proteinFocus = "lamb";
  else if (/fish|shrimp|seafood/.test(n)) proteinFocus = "seafood";
  else if (/chicken|shawarma|tikka|baik|nugget|mcchicken/.test(n)) proteinFocus = "chicken";

  let flavor: FlavorId = "mild";
  if (/spicy|dynamite|buffalo|jalapeno|shatta|fiery|chili|hot/.test(n)) flavor = "spicy";
  else if (/salad|fresh|lumi|greek|light|fit/.test(n)) flavor = "fresh";
  else if (/butter|cheese|alfredo|rich|creamy|dunk|mac/.test(n)) flavor = "rich";

  let style: StyleId = "grilled";
  if (/salad|cobb|raw/.test(n)) style = "raw";
  else if (/pizza|pasta|baked|dunk/.test(n)) style = "baked";
  else if (/fried|crispy|broast|nugget|fillet sandwich|baik|falafel|burger/.test(n)) style = "fried";
  else if (/grill|tikka|shawarma|kabab|mousahab/.test(n)) style = "grilled";

  return {
    proteinFocus: m.proteinFocus ?? proteinFocus,
    flavor: m.flavor ?? flavor,
    style: m.style ?? style,
  };
}

function budgetFit(price: number | null, b: BudgetId | null): "in" | "near" | "out" {
  if (!b) return "in";
  if (price === null) return "near";
  if (b === "value") {
    if (price <= 35) return "in";
    if (price <= 42) return "near";
    return "out";
  }
  if (b === "std") {
    if (price >= 28 && price <= 55) return "in";
    if (price >= 18 && price <= 65) return "near";
    return "out";
  }
  if (price >= 32) return "in";
  if (price >= 22) return "near";
  return "out";
}

function scoreMeal(m: Meal, p: Prefs): number {
  let s = 0;
  const t = tasteOf(m);
  const pickedRestaurants = new Set(
    p.dishPicks.map((id) => mealPool.find((x) => x.id === id)?.restaurant).filter(Boolean),
  );

  if (p.dishPicks.includes(m.id)) s += 14;
  else if (pickedRestaurants.has(m.restaurant)) s += 5;

  if (p.proteins.length && p.proteins.includes(t.proteinFocus)) s += 7;
  else if (p.proteins.length) s -= 2;
  if (p.flavors.length && p.flavors.includes(t.flavor)) s += 4;
  if (p.styles.length && p.styles.includes(t.style)) s += 4;

  if (p.goal && m.goals.includes(p.goal)) s += 4;
  if (p.diet && m.diets.includes(p.diet)) s += 4;
  if (p.cuisines.length && p.cuisines.includes(m.cuisine)) s += 5;

  if (m.kcal != null) {
    if (p.goal === "gain" && m.kcal >= 700) s += 3;
    if (p.goal === "lose" && m.kcal <= 550) s += 3;
    if (p.goal === "maintain" && m.kcal >= 450 && m.kcal <= 850) s += 2;
  }
  if (p.goal === "healthy" && (m.cuisine === "hl" || t.flavor === "fresh")) s += 3;

  const fit = budgetFit(m.basePrice, p.budget);
  if (fit === "in") s += 6;
  else if (fit === "near") s += 1;

  if (p.allergens.some((a) => m.allergens.includes(a))) s -= 20;
  return s;
}

function hashSeed(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getMealsForDay(dayKey: string, count = MEALS_PER_DAY_VIEW): Meal[] {
  const prefs = readPrefs();
  const seed = hashSeed(dayKey);

  let filtered = mealPool.filter((m) => {
    if (prefs.allergens.some((a) => m.allergens.includes(a))) return false;
    if (prefs.budget && budgetFit(m.basePrice, prefs.budget) === "out") return false;
    if (
      prefs.proteins.length === 1 &&
      prefs.proteins[0] === "veg" &&
      tasteOf(m).proteinFocus !== "veg"
    ) {
      return false;
    }
    return true;
  });

  if (!filtered.length) {
    filtered = mealPool.filter(
      (m) => !prefs.allergens.some((a) => m.allergens.includes(a)),
    );
  }

  const arr = [...filtered];
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const ranked = arr
    .map((m, i) => ({ m, i, score: scoreMeal(m, prefs) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.m);

  const diversified: Meal[] = [];
  const seen = new Set<string>();
  const leftover: Meal[] = [];
  for (const m of ranked) {
    if (!seen.has(m.restaurant)) {
      diversified.push(m);
      seen.add(m.restaurant);
    } else leftover.push(m);
  }
  const ordered = [...diversified, ...leftover];

  const bandSize = Math.min(6, ordered.length);
  const band = ordered.slice(0, bandSize);
  const rest = ordered.slice(bandSize);
  const offset = bandSize ? seed % bandSize : 0;
  const rotatedBand = [...band.slice(offset), ...band.slice(0, offset)];
  const picked = [...rotatedBand, ...rest].slice(0, count);
  return picked.map((m, i) => ({
    ...m,
    tag: i === 0 ? "Top match" : undefined,
  }));
}

export type Provider = {
  id: string;
  name: string;
  tone: string;
  bg: string;
  initials: string;
  priceMultiplier: number;
  deliveryFee: number;
  serviceFeePct: number;
  etaMin: number;
  etaMax: number;
  note?: string;
};

export const providers: Provider[] = [
  {
    id: "hungerstation",
    name: "HungerStation",
    tone: "text-[#FFB400]",
    bg: "bg-[#FFB400]",
    initials: "HS",
    priceMultiplier: 1.0,
    deliveryFee: 9,
    serviceFeePct: 0.05,
    etaMin: 25,
    etaMax: 35,
    note: "Fastest near you",
  },
  {
    id: "jahez",
    name: "Jahez",
    tone: "text-[#E11D48]",
    bg: "bg-[#E11D48]",
    initials: "JZ",
    priceMultiplier: 1.04,
    deliveryFee: 7,
    serviceFeePct: 0.04,
    etaMin: 30,
    etaMax: 40,
  },
  {
    id: "keeta",
    name: "Keeta",
    tone: "text-[#FFD60A]",
    bg: "bg-[#111827]",
    initials: "K",
    priceMultiplier: 0.96,
    deliveryFee: 5,
    serviceFeePct: 0.03,
    etaMin: 35,
    etaMax: 50,
    note: "Cheapest total",
  },
  {
    id: "calo",
    name: "Calo",
    tone: "text-[#10B981]",
    bg: "bg-[#10B981]",
    initials: "C",
    priceMultiplier: 1.08,
    deliveryFee: 0,
    serviceFeePct: 0.02,
    etaMin: 45,
    etaMax: 60,
    note: "Free delivery",
  },
];

export function getMealById(id: string) {
  return mealPool.find((m) => m.id === id);
}

/** HungerStation ETA from restaurant row when available. */
export function providersForMeal(meal: Meal): Provider[] {
  const etaMin = meal.etaLo ?? undefined;
  const etaMax = meal.etaHi ?? undefined;
  return providers.map((p) => {
    if (p.id !== "hungerstation" || (etaMin == null && etaMax == null)) return p;
    return {
      ...p,
      etaMin: etaMin ?? p.etaMin,
      etaMax: etaMax ?? p.etaMax,
    };
  });
}
