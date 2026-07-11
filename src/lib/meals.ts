// Real menu items parsed from HungerStation-style restaurant screenshots.
// All prices in SAR. Dish photography sourced from Unsplash (premium free CDN).
// Low-quality screenshots have been replaced with vibrant, high-resolution
// professional food photography. Meals without a premium visual are omitted.
const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const IMG = {
  kababChicken: UNSPLASH("photo-1598515214211-89d3c73ae83b"), // grilled chicken skewers
  kababHalabi: UNSPLASH("photo-1544025162-d76694265947"), // grilled kabab platter
  halfChicken: UNSPLASH("photo-1588167056547-c183313da47c"), // roasted half chicken
  pizzaDunkIt: UNSPLASH("photo-1513104890138-7c749659a591"), // wood-fired pizza
  pizzaPepperoni: UNSPLASH("photo-1628840042765-356cda07504e"), // pepperoni pizza
  pizzaMargarita: UNSPLASH("photo-1574071318508-1cdbab80d002"), // margherita pizza
  tikkaLumi: UNSPLASH("photo-1567620832903-9fc6debc209f"), // grilled tikka bowl
  tikkaGreek: UNSPLASH("photo-1546793665-c74683f339c1"), // yogurt marinated chicken
  tikkaSpicy: UNSPLASH("photo-1610057099443-fde8c4d50f91"), // spicy grilled chicken
  pastaTomato: UNSPLASH("photo-1608219992759-35f27d6d0c85"), // creamy tomato pasta
  fiestaBowl: UNSPLASH("photo-1546069901-ba9599a7e63c"), // healthy chicken bowl
  butterChicken: UNSPLASH("photo-1603894584373-5ac82b2ae398"), // butter chicken
  cobbSalad: UNSPLASH("photo-1512621776951-a57141f2eefd"), // cobb salad
  asianSalad: UNSPLASH("photo-1512058564366-18510be2db19"), // asian salad
  buffaloSalad: UNSPLASH("photo-1626082927389-6cd097cdc6ec"), // buffalo chicken salad
};

// Onboarding vocabularies (kept in sync with src/routes/onboarding.tsx)
export type GoalId = "healthy" | "lose" | "gain" | "maintain";
export type DietId = "balanced" | "lowcarb" | "highprotein" | "veg";
export type BudgetId = "value" | "std" | "premium";
export type CuisineId = "ar" | "hl" | "it" | "us" | "as";
export type AllergenId =
  | "eggs" | "dairy" | "soy" | "peanut" | "tree" | "fish" | "shell" | "wheat";

export type Meal = {
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
  basePrice: number; // SAR
  // Onboarding taxonomy mapping
  cuisine: CuisineId;
  goals: GoalId[];
  diets: DietId[];
  allergens: AllergenId[];
};

const SLOT = "Lunch · 12:30 PM";

export const mealPool: Meal[] = [
  // Shebbak Beirut — Arabic
  {
    id: "shb-kabab-chicken", slot: SLOT,
    name: "Kabab Chicken Platter", restaurant: "Shebbak Beirut",
    kcal: 1393, protein: 85, carbs: 110, fat: 45,
    image: shebbakKababChicken.url, basePrice: 34,
    cuisine: "ar", goals: ["gain", "maintain"], diets: ["highprotein", "balanced"],
    allergens: ["wheat"],
  },
  {
    id: "shb-kabab-halabi", slot: SLOT,
    name: "Kabab Halabi Platter", restaurant: "Shebbak Beirut",
    kcal: 1188, protein: 78, carbs: 95, fat: 45,
    image: shebbakKababHalabi.url, basePrice: 39,
    cuisine: "ar", goals: ["gain", "maintain"], diets: ["highprotein", "balanced"],
    allergens: ["wheat", "soy"],
  },
  {
    id: "shb-half-chicken", slot: SLOT,
    name: "Half Chicken Mousahab", restaurant: "Shebbak Beirut",
    kcal: 1552, protein: 95, carbs: 115, fat: 60,
    image: shebbakHalfChicken.url, basePrice: 39,
    cuisine: "ar", goals: ["gain"], diets: ["highprotein"],
    allergens: ["wheat"],
  },

  // LETS PIZZA WOOD — Italian
  {
    id: "lpw-dunk-it", slot: SLOT,
    name: "Just Dunk It", restaurant: "Let's Pizza Wood",
    kcal: 1400, protein: 50, carbs: 150, fat: 60,
    image: pizzaDunkIt.url, basePrice: 54,
    cuisine: "it", goals: ["gain", "maintain"], diets: ["balanced", "veg"],
    allergens: ["wheat", "dairy"],
  },
  {
    id: "lpw-dunk-pepperoni", slot: SLOT,
    name: "Just Dunk It Pepperoni", restaurant: "Let's Pizza Wood",
    kcal: 1450, protein: 58, carbs: 145, fat: 65,
    image: pizzaPepperoni.url, basePrice: 54,
    cuisine: "it", goals: ["gain", "maintain"], diets: ["balanced"],
    allergens: ["wheat", "dairy"],
  },
  {
    id: "lpw-dunk-margarita", slot: SLOT,
    name: "Just Dunk It Margarita", restaurant: "Let's Pizza Wood",
    kcal: 1450, protein: 50, carbs: 155, fat: 65,
    image: pizzaMargarita.url, basePrice: 54,
    cuisine: "it", goals: ["gain", "maintain"], diets: ["balanced", "veg"],
    allergens: ["wheat", "dairy"],
  },

  // Swaikhat — Arabic grills
  {
    id: "swk-lumi-tikka", slot: SLOT,
    name: "Lumi Tikka", restaurant: "Swaikhat",
    kcal: 650, protein: 55, carbs: 25, fat: 38,
    image: swaikhatLumi.url, basePrice: 37,
    cuisine: "ar", goals: ["gain", "lose", "healthy"],
    diets: ["highprotein", "lowcarb"], allergens: ["wheat"],
  },
  {
    id: "swk-greek-yogurt", slot: SLOT,
    name: "Greek Yogurt Tikka", restaurant: "Swaikhat",
    kcal: 640, protein: 56, carbs: 22, fat: 36,
    image: swaikhatGreek.url, basePrice: 39,
    cuisine: "ar", goals: ["gain", "lose", "healthy"],
    diets: ["highprotein", "lowcarb"], allergens: ["dairy", "wheat"],
  },
  {
    id: "swk-spicy-tikka", slot: SLOT,
    name: "Spicy Tikka", restaurant: "Swaikhat",
    kcal: 700, protein: 60, carbs: 20, fat: 45,
    image: swaikhatSpicy.url, basePrice: 42,
    cuisine: "ar", goals: ["gain"], diets: ["highprotein", "lowcarb"],
    allergens: ["wheat"],
  },

  // Calo — Healthy prepared meals
  {
    id: "calo-tomato-pasta", slot: SLOT,
    name: "Creamy Tomato Pasta", restaurant: "Calo",
    kcal: 622, protein: 54, carbs: 62, fat: 15,
    image: caloTomato.url, basePrice: 36,
    cuisine: "hl", goals: ["healthy", "maintain", "gain"],
    diets: ["balanced", "highprotein"], allergens: ["wheat", "dairy"],
  },
  {
    id: "calo-fiesta-chicken", slot: SLOT,
    name: "Fiesta Chicken Bowl", restaurant: "Calo",
    kcal: 529, protein: 39, carbs: 55, fat: 16,
    image: caloFiesta.url, basePrice: 32,
    cuisine: "hl", goals: ["healthy", "lose", "maintain"],
    diets: ["balanced"], allergens: [],
  },
  {
    id: "calo-butter-chicken", slot: SLOT,
    name: "Butter Chicken", restaurant: "Calo",
    kcal: 612, protein: 46, carbs: 73, fat: 10,
    image: caloButter.url, basePrice: 29,
    cuisine: "hl", goals: ["healthy", "maintain", "gain"],
    diets: ["highprotein", "balanced"], allergens: ["dairy"],
  },

  // SALATA — Healthy salads
  {
    id: "slt-downtown-cobb", slot: SLOT,
    name: "Down Town Cobb Salad", restaurant: "Salata",
    kcal: 850, protein: 55, carbs: 30, fat: 55,
    image: salataCobb.url, basePrice: 46,
    cuisine: "hl", goals: ["healthy", "gain", "maintain"],
    diets: ["highprotein", "lowcarb"], allergens: ["dairy", "eggs"],
  },
  {
    id: "slt-asian-salad", slot: SLOT,
    name: "Asian Salad", restaurant: "Salata",
    kcal: 738, protein: 40, carbs: 45, fat: 42,
    image: salataAsian.url, basePrice: 48,
    cuisine: "as", goals: ["healthy", "lose", "maintain"],
    diets: ["balanced"], allergens: ["tree", "soy"],
  },
  {
    id: "slt-buffalo-chicken", slot: SLOT,
    name: "Buffalo Chicken Salad", restaurant: "Salata",
    kcal: 683, protein: 48, carbs: 25, fat: 42,
    image: salataBuffalo.url, basePrice: 37,
    cuisine: "hl", goals: ["healthy", "lose"],
    diets: ["highprotein", "lowcarb"], allergens: ["dairy"],
  },
];

// Backward-compat export used elsewhere.
export const meals = mealPool.slice(0, 5);

// ---- Onboarding prefs (persisted from src/routes/onboarding.tsx) ----
export type Prefs = {
  goal: GoalId | null;
  diet: DietId | null;
  budget: BudgetId | null;
  cuisines: CuisineId[];
  allergens: AllergenId[];
};

export function readPrefs(): Prefs {
  const empty: Prefs = { goal: null, diet: null, budget: null, cuisines: [], allergens: [] };
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem("fylo:prefs");
    if (!raw) return empty;
    const p = JSON.parse(raw);
    return { ...empty, ...p };
  } catch {
    return empty;
  }
}

function budgetRange(b: BudgetId | null): [number, number] {
  if (b === "value") return [0, 35];
  if (b === "premium") return [65, 9999];
  if (b === "std") return [35, 65];
  return [0, 9999];
}

function scoreMeal(m: Meal, p: Prefs): number {
  let s = 0;
  if (p.goal && m.goals.includes(p.goal)) s += 4;
  if (p.diet && m.diets.includes(p.diet)) s += 3;
  if (p.cuisines.length && p.cuisines.includes(m.cuisine)) s += 3;
  const [lo, hi] = budgetRange(p.budget);
  if (m.basePrice >= lo && m.basePrice <= hi) s += 2;
  // Allergen penalty — hard filter handled separately, but soft-rank too.
  if (p.allergens.some((a) => m.allergens.includes(a))) s -= 10;
  return s;
}

// Deterministic shuffle by day key — strict recency penalty simulation.
function hashSeed(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getMealsForDay(dayKey: string, count = 10): Meal[] {
  const prefs = readPrefs();
  const seed = hashSeed(dayKey);
  // Hard-filter allergens if the user specified any
  const filtered = prefs.allergens.length
    ? mealPool.filter((m) => !prefs.allergens.some((a) => m.allergens.includes(a)))
    : [...mealPool];
  // Deterministic shuffle to simulate day-to-day variety.
  const arr = [...filtered];
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Stable sort by preference score (higher first), preserving shuffled order for ties.
  const ranked = arr
    .map((m, i) => ({ m, i, score: scoreMeal(m, prefs) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.m);
  const picked = ranked.slice(0, count);
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
