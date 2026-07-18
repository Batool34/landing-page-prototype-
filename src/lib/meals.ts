// Menu catalog: HungerStation Riyadh bestsellers (Al Baik, Shawarmer, Herfy)
// plus existing partner-style items. Prices in SAR from HS public menus.
// Dish photography: Unsplash (premium free CDN) — HS images are CDN-hotlinked
// and often gated, so we use matching professional food photography.
const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const IMG = {
  // Al Baik
  bigBaik: UNSPLASH("photo-1606755962773-d324e0a13086"), // fried chicken sandwich
  albaik4pc: UNSPLASH("photo-1626645738196-c2a7c87a8f58"), // fried chicken meal
  albaikFillet: UNSPLASH("photo-1562967914-608f82629710"), // chicken fillet wrap
  // Shawarmer
  aboAlsawarikh: UNSPLASH("photo-1529006557810-274b9b2fc783"), // shawarma wrap
  rajRaj: UNSPLASH("photo-1664472755793-b05e0d5c1f1c"), // shawarma plate
  twoArabi: UNSPLASH("photo-1599487488170-d11ec9c172f3"), // arabic shawarma
  // Herfy
  bigHerfy: UNSPLASH("photo-1568901346375-23c9450c58cd"), // cheeseburger
  superHerfy: UNSPLASH("photo-1550547660-d9450f859349"), // large beef burger
  grilledChickenHerfy: UNSPLASH("photo-1572802419224-296b0aeee0d9"), // grilled chicken burger
  // Kudu
  kuduChicken: UNSPLASH("photo-1606755962773-d324e0a13086"), // grilled chicken sandwich
  kuduBurger: UNSPLASH("photo-1568901346375-23c9450c58cd"), // chicken burger
  kuduSalad: UNSPLASH("photo-1512621776951-a57141f2eefd"), // chicken salad
  // Maestro Pizza
  maestroAlfredo: UNSPLASH("photo-1574071318508-1cdbab80d002"), // chicken pizza
  maestroDynamite: UNSPLASH("photo-1628840042765-356cda07504e"), // spicy pizza
  maestroPepperoni: UNSPLASH("photo-1513104890138-7c749659a591"), // pepperoni
  // McDonald's
  bigMac: UNSPLASH("photo-1550547660-d9450f859349"), // big mac style
  mcdMeal: UNSPLASH("photo-1568901346375-23c9450c58cd"), // burger meal
  mcChicken: UNSPLASH("photo-1606755962773-d324e0a13086"), // chicken sandwich
  // Operation Falafel
  ofShawarma: UNSPLASH("photo-1529006557810-274b9b2fc783"), // chicken shawarma
  ofFalafel: UNSPLASH("photo-1626700051175-67714642f5f0"), // falafel wrap
  ofBeefShawarma: UNSPLASH("photo-1599487488170-d11ec9c172f3"), // beef shawarma
  // Century Burger
  cbOriginal: UNSPLASH("photo-1550547660-d9450f859349"), // signature burger
  cbSpicy: UNSPLASH("photo-1568901346375-23c9450c58cd"), // spicy burger
  cbBlack: UNSPLASH("photo-1572802419224-296b0aeee0d9"), // specialty burger
  // Existing
  kababChicken: UNSPLASH("photo-1598515214211-89d3c73ae83b"), // grilled chicken skewers
  kababHalabi: UNSPLASH("photo-1544025162-d76694265947"), // grilled kabab platter
  halfChicken: UNSPLASH("photo-1594221708779-94832f4320d1"), // char-grilled chicken with fries & coleslaw
  pizzaDunkIt: UNSPLASH("photo-1513104890138-7c749659a591"), // wood-fired pizza
  pizzaPepperoni: UNSPLASH("photo-1628840042765-356cda07504e"), // pepperoni pizza
  pizzaMargarita: UNSPLASH("photo-1574071318508-1cdbab80d002"), // margherita pizza
  tikkaLumi: UNSPLASH("photo-1567620832903-9fc6debc209f"), // grilled tikka bowl
  tikkaGreek: UNSPLASH("photo-1546793665-c74683f339c1"), // yogurt marinated chicken
  tikkaSpicy: UNSPLASH("photo-1610057099443-fde8c4d50f91"), // spicy grilled chicken
  pastaTomato: UNSPLASH("photo-1621996346565-e3dbc646d9a9"), // creamy tomato pasta
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
/** Taste signals collected in onboarding and used by the ranking engine. */
export type ProteinFocus = "chicken" | "beef" | "lamb" | "seafood" | "veg";
export type FlavorId = "spicy" | "mild" | "rich" | "fresh";
export type StyleId = "grilled" | "fried" | "baked" | "raw";

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
  cuisine: CuisineId;
  goals: GoalId[];
  diets: DietId[];
  allergens: AllergenId[];
  /** Optional taste tags — heuristics fill gaps for older catalog items. */
  proteinFocus?: ProteinFocus;
  flavor?: FlavorId;
  style?: StyleId;
};

const SLOT = "Lunch · 12:30 PM";

export const mealPool: Meal[] = [
  // Shebbak Beirut — Arabic
  {
    id: "shb-kabab-chicken", slot: SLOT,
    name: "Kabab Chicken Platter", restaurant: "Shebbak Beirut",
    kcal: 1393, protein: 85, carbs: 110, fat: 45,
    image: IMG.kababChicken, basePrice: 34,
    cuisine: "ar", goals: ["gain", "maintain"], diets: ["highprotein", "balanced"],
    allergens: ["wheat"],
  },
  {
    id: "shb-kabab-halabi", slot: SLOT,
    name: "Kabab Halabi Platter", restaurant: "Shebbak Beirut",
    kcal: 1188, protein: 78, carbs: 95, fat: 45,
    image: IMG.kababHalabi, basePrice: 39,
    cuisine: "ar", goals: ["gain", "maintain"], diets: ["highprotein", "balanced"],
    allergens: ["wheat", "soy"],
  },
  {
    id: "shb-half-chicken", slot: SLOT,
    name: "Half Chicken Mousahab", restaurant: "Shebbak Beirut",
    kcal: 1552, protein: 95, carbs: 115, fat: 60,
    image: IMG.halfChicken, basePrice: 39,
    cuisine: "ar", goals: ["gain"], diets: ["highprotein"],
    allergens: ["wheat"],
  },

  // LETS PIZZA WOOD — Italian
  {
    id: "lpw-dunk-it", slot: SLOT,
    name: "Just Dunk It", restaurant: "Let's Pizza Wood",
    kcal: 1400, protein: 50, carbs: 150, fat: 60,
    image: IMG.pizzaDunkIt, basePrice: 54,
    cuisine: "it", goals: ["gain", "maintain"], diets: ["balanced", "veg"],
    allergens: ["wheat", "dairy"],
  },
  {
    id: "lpw-dunk-pepperoni", slot: SLOT,
    name: "Just Dunk It Pepperoni", restaurant: "Let's Pizza Wood",
    kcal: 1450, protein: 58, carbs: 145, fat: 65,
    image: IMG.pizzaPepperoni, basePrice: 54,
    cuisine: "it", goals: ["gain", "maintain"], diets: ["balanced"],
    allergens: ["wheat", "dairy"],
  },
  {
    id: "lpw-dunk-margarita", slot: SLOT,
    name: "Just Dunk It Margarita", restaurant: "Let's Pizza Wood",
    kcal: 1450, protein: 50, carbs: 155, fat: 65,
    image: IMG.pizzaMargarita, basePrice: 54,
    cuisine: "it", goals: ["gain", "maintain"], diets: ["balanced", "veg"],
    allergens: ["wheat", "dairy"],
  },

  // Swaikhat — Arabic grills
  {
    id: "swk-lumi-tikka", slot: SLOT,
    name: "Lumi Tikka", restaurant: "Swaikhat",
    kcal: 650, protein: 55, carbs: 25, fat: 38,
    image: IMG.tikkaLumi, basePrice: 37,
    cuisine: "ar", goals: ["gain", "lose", "healthy"],
    diets: ["highprotein", "lowcarb"], allergens: ["wheat"],
  },
  {
    id: "swk-greek-yogurt", slot: SLOT,
    name: "Greek Yogurt Tikka", restaurant: "Swaikhat",
    kcal: 640, protein: 56, carbs: 22, fat: 36,
    image: IMG.tikkaGreek, basePrice: 39,
    cuisine: "ar", goals: ["gain", "lose", "healthy"],
    diets: ["highprotein", "lowcarb"], allergens: ["dairy", "wheat"],
  },
  {
    id: "swk-spicy-tikka", slot: SLOT,
    name: "Spicy Tikka", restaurant: "Swaikhat",
    kcal: 700, protein: 60, carbs: 20, fat: 45,
    image: IMG.tikkaSpicy, basePrice: 42,
    cuisine: "ar", goals: ["gain"], diets: ["highprotein", "lowcarb"],
    allergens: ["wheat"],
  },

  // Calo — Healthy prepared meals
  {
    id: "calo-tomato-pasta", slot: SLOT,
    name: "Creamy Tomato Pasta", restaurant: "Calo",
    kcal: 622, protein: 54, carbs: 62, fat: 15,
    image: IMG.pastaTomato, basePrice: 36,
    cuisine: "hl", goals: ["healthy", "maintain", "gain"],
    diets: ["balanced", "highprotein"], allergens: ["wheat", "dairy"],
  },
  {
    id: "calo-fiesta-chicken", slot: SLOT,
    name: "Fiesta Chicken Bowl", restaurant: "Calo",
    kcal: 529, protein: 39, carbs: 55, fat: 16,
    image: IMG.fiestaBowl, basePrice: 32,
    cuisine: "hl", goals: ["healthy", "lose", "maintain"],
    diets: ["balanced"], allergens: [],
  },
  {
    id: "calo-butter-chicken", slot: SLOT,
    name: "Butter Chicken", restaurant: "Calo",
    kcal: 612, protein: 46, carbs: 73, fat: 10,
    image: IMG.butterChicken, basePrice: 29,
    cuisine: "hl", goals: ["healthy", "maintain", "gain"],
    diets: ["highprotein", "balanced"], allergens: ["dairy"],
  },

  // SALATA — Healthy salads
  {
    id: "slt-downtown-cobb", slot: SLOT,
    name: "Down Town Cobb Salad", restaurant: "Salata",
    kcal: 850, protein: 55, carbs: 30, fat: 55,
    image: IMG.cobbSalad, basePrice: 46,
    cuisine: "hl", goals: ["healthy", "gain", "maintain"],
    diets: ["highprotein", "lowcarb"], allergens: ["dairy", "eggs"],
  },
  {
    id: "slt-asian-salad", slot: SLOT,
    name: "Asian Salad", restaurant: "Salata",
    kcal: 738, protein: 40, carbs: 45, fat: 42,
    image: IMG.asianSalad, basePrice: 48,
    cuisine: "as", goals: ["healthy", "lose", "maintain"],
    diets: ["balanced"], allergens: ["tree", "soy"],
  },
  {
    id: "slt-buffalo-chicken", slot: SLOT,
    name: "Buffalo Chicken Salad", restaurant: "Salata",
    kcal: 683, protein: 48, carbs: 25, fat: 42,
    image: IMG.buffaloSalad, basePrice: 37,
    cuisine: "hl", goals: ["healthy", "lose"],
    diets: ["highprotein", "lowcarb"], allergens: ["dairy"],
  },

  // —— HungerStation Riyadh bestsellers (scraped Jul 2026) ——
  // After the original pool so onboarding dishPicks (slice 0–12) stay unchanged.

  // Al Baik — Saudi broasted chicken (HS: Al Ulaya / Ad Dhubbat)
  {
    id: "abk-big-baik", slot: SLOT,
    name: "Big Baik", restaurant: "Al Baik",
    kcal: 680, protein: 42, carbs: 52, fat: 32,
    image: IMG.bigBaik, basePrice: 17.5,
    cuisine: "ar", goals: ["gain", "maintain"], diets: ["highprotein", "balanced"],
    allergens: ["wheat", "eggs"],
    proteinFocus: "chicken", flavor: "mild", style: "fried",
  },
  {
    id: "abk-4pc-meal", slot: SLOT,
    name: "4 Piece Chicken Meal", restaurant: "Al Baik",
    kcal: 1378, protein: 72, carbs: 98, fat: 68,
    image: IMG.albaik4pc, basePrice: 22,
    cuisine: "ar", goals: ["gain"], diets: ["highprotein"],
    allergens: ["wheat"],
    proteinFocus: "chicken", flavor: "mild", style: "fried",
  },
  {
    id: "abk-fillet-sandwich", slot: SLOT,
    name: "Chicken Fillet Sandwich", restaurant: "Al Baik",
    kcal: 520, protein: 32, carbs: 48, fat: 22,
    image: IMG.albaikFillet, basePrice: 10.5,
    cuisine: "ar", goals: ["maintain", "gain"], diets: ["balanced", "highprotein"],
    allergens: ["wheat"],
    proteinFocus: "chicken", flavor: "mild", style: "fried",
  },

  // Shawarmer — signature shawarma (HS: Riyadh #16557)
  {
    id: "shm-abo-alsawarikh", slot: SLOT,
    name: "Abo Alsawarikh", restaurant: "Shawarmer",
    kcal: 619, protein: 38, carbs: 48, fat: 28,
    image: IMG.aboAlsawarikh, basePrice: 21,
    cuisine: "ar", goals: ["gain", "maintain"], diets: ["highprotein", "balanced"],
    allergens: ["wheat"],
    proteinFocus: "chicken", flavor: "mild", style: "grilled",
  },
  {
    id: "shm-raj-raj", slot: SLOT,
    name: "Raj Raj", restaurant: "Shawarmer",
    kcal: 744, protein: 36, carbs: 58, fat: 34,
    image: IMG.rajRaj, basePrice: 23,
    cuisine: "ar", goals: ["gain", "maintain"], diets: ["balanced", "highprotein"],
    allergens: ["wheat"],
    proteinFocus: "chicken", flavor: "spicy", style: "grilled",
  },
  {
    id: "shm-two-arabi", slot: SLOT,
    name: "Two Arabi", restaurant: "Shawarmer",
    kcal: 864, protein: 44, carbs: 72, fat: 36,
    image: IMG.twoArabi, basePrice: 20,
    cuisine: "ar", goals: ["gain"], diets: ["highprotein", "balanced"],
    allergens: ["wheat"],
    proteinFocus: "chicken", flavor: "mild", style: "grilled",
  },

  // Herfy — Saudi burgers (HS bestsellers: Raid / Al Suwaidi)
  {
    id: "hrf-big-herfy-cheese", slot: SLOT,
    name: "Big Herfy With Cheese", restaurant: "Herfy",
    kcal: 620, protein: 32, carbs: 48, fat: 32,
    image: IMG.bigHerfy, basePrice: 25,
    cuisine: "us", goals: ["gain", "maintain"], diets: ["balanced"],
    allergens: ["wheat", "dairy"],
    proteinFocus: "beef", flavor: "rich", style: "grilled",
  },
  {
    id: "hrf-super-herfy", slot: SLOT,
    name: "Super Herfy", restaurant: "Herfy",
    kcal: 754, protein: 38, carbs: 52, fat: 40,
    image: IMG.superHerfy, basePrice: 31,
    cuisine: "us", goals: ["gain"], diets: ["balanced", "highprotein"],
    allergens: ["wheat", "dairy"],
    proteinFocus: "beef", flavor: "rich", style: "grilled",
  },
  {
    id: "hrf-double-grilled-chicken", slot: SLOT,
    name: "Double Grilled Chicken", restaurant: "Herfy",
    kcal: 680, protein: 46, carbs: 42, fat: 30,
    image: IMG.grilledChickenHerfy, basePrice: 28,
    cuisine: "us", goals: ["gain", "maintain", "healthy"],
    diets: ["highprotein", "balanced"], allergens: ["wheat", "dairy"],
    proteinFocus: "chicken", flavor: "mild", style: "grilled",
  },

  // Kudu — Saudi fast food (HS: Malaz #6923)
  {
    id: "kdu-chicken-sandwich", slot: SLOT,
    name: "Kudu Chicken Sandwich", restaurant: "Kudu",
    kcal: 609, protein: 36, carbs: 48, fat: 28,
    image: IMG.kuduChicken, basePrice: 28,
    cuisine: "us", goals: ["gain", "maintain"], diets: ["highprotein", "balanced"],
    allergens: ["wheat", "soy", "eggs"],
    proteinFocus: "chicken", flavor: "mild", style: "grilled",
  },
  {
    id: "kdu-chicken-burger", slot: SLOT,
    name: "Chicken Burger Sandwich", restaurant: "Kudu",
    kcal: 580, protein: 32, carbs: 45, fat: 28,
    image: IMG.kuduBurger, basePrice: 23,
    cuisine: "us", goals: ["gain", "maintain"], diets: ["balanced"],
    allergens: ["wheat", "eggs"],
    proteinFocus: "chicken", flavor: "mild", style: "fried",
  },
  {
    id: "kdu-chicken-salad", slot: SLOT,
    name: "Kudu Chicken Salad", restaurant: "Kudu",
    kcal: 178, protein: 28, carbs: 8, fat: 6,
    image: IMG.kuduSalad, basePrice: 26,
    cuisine: "hl", goals: ["healthy", "lose", "maintain"],
    diets: ["highprotein", "lowcarb"], allergens: [],
    proteinFocus: "chicken", flavor: "fresh", style: "raw",
  },

  // Maestro Pizza — Italian (HS: Riyadh #6287)
  {
    id: "mst-alfredo-chicken", slot: SLOT,
    name: "Alfredo Chicken Pizza", restaurant: "Maestro Pizza",
    kcal: 1231, protein: 52, carbs: 110, fat: 58,
    image: IMG.maestroAlfredo, basePrice: 40,
    cuisine: "it", goals: ["gain", "maintain"], diets: ["balanced"],
    allergens: ["wheat", "dairy"],
    proteinFocus: "chicken", flavor: "rich", style: "baked",
  },
  {
    id: "mst-dynamite-chicken", slot: SLOT,
    name: "Dynamite Chicken Pizza", restaurant: "Maestro Pizza",
    kcal: 1298, protein: 48, carbs: 118, fat: 60,
    image: IMG.maestroDynamite, basePrice: 40,
    cuisine: "it", goals: ["gain"], diets: ["balanced"],
    allergens: ["wheat", "dairy"],
    proteinFocus: "chicken", flavor: "spicy", style: "baked",
  },
  {
    id: "mst-pepperoni", slot: SLOT,
    name: "Pepperoni Pizza", restaurant: "Maestro Pizza",
    kcal: 571, protein: 28, carbs: 52, fat: 26,
    image: IMG.maestroPepperoni, basePrice: 37,
    cuisine: "it", goals: ["maintain", "gain"], diets: ["balanced"],
    allergens: ["wheat", "dairy"],
    proteinFocus: "beef", flavor: "rich", style: "baked",
  },

  // McDonald's — US (HS: Okaz / Raid)
  {
    id: "mcd-big-mac", slot: SLOT,
    name: "Big Mac", restaurant: "McDonald's",
    kcal: 524, protein: 26, carbs: 42, fat: 28,
    image: IMG.bigMac, basePrice: 19,
    cuisine: "us", goals: ["maintain", "gain"], diets: ["balanced"],
    allergens: ["wheat", "dairy", "eggs"],
    proteinFocus: "beef", flavor: "rich", style: "grilled",
  },
  {
    id: "mcd-big-mac-meal", slot: SLOT,
    name: "Big Mac Meal", restaurant: "McDonald's",
    kcal: 1203, protein: 38, carbs: 120, fat: 55,
    image: IMG.mcdMeal, basePrice: 27,
    cuisine: "us", goals: ["gain"], diets: ["balanced"],
    allergens: ["wheat", "dairy", "eggs"],
    proteinFocus: "beef", flavor: "rich", style: "fried",
  },
  {
    id: "mcd-mc-chicken", slot: SLOT,
    name: "McChicken", restaurant: "McDonald's",
    kcal: 420, protein: 18, carbs: 42, fat: 20,
    image: IMG.mcChicken, basePrice: 19,
    cuisine: "us", goals: ["maintain"], diets: ["balanced"],
    allergens: ["wheat", "eggs"],
    proteinFocus: "chicken", flavor: "mild", style: "fried",
  },

  // Operation Falafel — Arabic street food (HS: Al Nuzhah #28710)
  {
    id: "of-crispy-chicken-shawarma", slot: SLOT,
    name: "Crispy Chicken Shawarma", restaurant: "Operation Falafel",
    kcal: 630, protein: 36, carbs: 52, fat: 28,
    image: IMG.ofShawarma, basePrice: 24,
    cuisine: "ar", goals: ["gain", "maintain"], diets: ["highprotein", "balanced"],
    allergens: ["wheat"],
    proteinFocus: "chicken", flavor: "spicy", style: "fried",
  },
  {
    id: "of-crispy-falafel", slot: SLOT,
    name: "Crispy Falafel Sandwich", restaurant: "Operation Falafel",
    kcal: 560, protein: 18, carbs: 58, fat: 26,
    image: IMG.ofFalafel, basePrice: 17,
    cuisine: "ar", goals: ["maintain", "healthy", "lose"],
    diets: ["veg", "balanced"], allergens: ["wheat"],
    proteinFocus: "veg", flavor: "fresh", style: "fried",
  },
  {
    id: "of-crispy-beef-shawarma", slot: SLOT,
    name: "Crispy Beef Shawarma", restaurant: "Operation Falafel",
    kcal: 590, protein: 34, carbs: 48, fat: 26,
    image: IMG.ofBeefShawarma, basePrice: 29,
    cuisine: "ar", goals: ["gain", "maintain"], diets: ["highprotein", "balanced"],
    allergens: ["wheat"],
    proteinFocus: "beef", flavor: "rich", style: "grilled",
  },

  // Century Burger — premium burgers (HS: An Nakhil / Riyadh)
  {
    id: "cb-original", slot: SLOT,
    name: "The Original CB", restaurant: "Century Burger",
    kcal: 1085, protein: 48, carbs: 55, fat: 68,
    image: IMG.cbOriginal, basePrice: 37,
    cuisine: "us", goals: ["gain"], diets: ["highprotein", "balanced"],
    allergens: ["wheat", "dairy"],
    proteinFocus: "beef", flavor: "rich", style: "grilled",
  },
  {
    id: "cb-spicy-red", slot: SLOT,
    name: "Spicy Red", restaurant: "Century Burger",
    kcal: 968, protein: 44, carbs: 52, fat: 58,
    image: IMG.cbSpicy, basePrice: 39,
    cuisine: "us", goals: ["gain", "maintain"], diets: ["balanced"],
    allergens: ["wheat", "dairy"],
    proteinFocus: "beef", flavor: "spicy", style: "grilled",
  },
  {
    id: "cb-black-beetroot", slot: SLOT,
    name: "Black Beetroot", restaurant: "Century Burger",
    kcal: 750, protein: 38, carbs: 48, fat: 42,
    image: IMG.cbBlack, basePrice: 25,
    cuisine: "us", goals: ["maintain", "gain"], diets: ["balanced"],
    allergens: ["wheat", "dairy"],
    proteinFocus: "beef", flavor: "rich", style: "grilled",
  },
];

// Backward-compat export used elsewhere.
export const meals = mealPool.slice(0, 5);

/** Curated real-restaurant dishes for onboarding photo picks. */
export const ONBOARDING_DISH_IDS = [
  "abk-big-baik",
  "shm-abo-alsawarikh",
  "hrf-big-herfy-cheese",
  "kdu-chicken-sandwich",
  "mst-alfredo-chicken",
  "mcd-big-mac",
  "of-crispy-chicken-shawarma",
  "of-crispy-falafel",
  "cb-original",
  "abk-4pc-meal",
  "shm-raj-raj",
  "kdu-chicken-salad",
] as const;

export function getOnboardingDishes(): Meal[] {
  return ONBOARDING_DISH_IDS.map((id) => mealPool.find((m) => m.id === id)).filter(
    (m): m is Meal => Boolean(m),
  );
}

// ---- Onboarding prefs (persisted from src/routes/onboarding.tsx) ----
export type Prefs = {
  goal: GoalId | null;
  diet: DietId | null;
  budget: BudgetId | null;
  cuisines: CuisineId[];
  allergens: AllergenId[];
  /** Taste signals from protein chips + pair winners + dish picks. */
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
    // Flatten taste.* so the ranking engine always sees one shape.
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

/** Infer taste tags when a catalog item predates explicit tagging. */
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

/**
 * Budget bands — hard-filter "out", soft-boost "in".
 * Premium means "happy to spend up" (catalog tops ~54 SAR), not a 65+ floor.
 */
function budgetFit(price: number, b: BudgetId | null): "in" | "near" | "out" {
  if (!b) return "in";
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
  // premium
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

  // Exact dish the user already said they crave
  if (p.dishPicks.includes(m.id)) s += 14;
  else if (pickedRestaurants.has(m.restaurant)) s += 5;

  // Protein / flavor / style from chips + forced pairs
  if (p.proteins.length && p.proteins.includes(t.proteinFocus)) s += 7;
  else if (p.proteins.length) s -= 2;
  if (p.flavors.length && p.flavors.includes(t.flavor)) s += 4;
  if (p.styles.length && p.styles.includes(t.style)) s += 4;

  if (p.goal && m.goals.includes(p.goal)) s += 4;
  if (p.diet && m.diets.includes(p.diet)) s += 4;
  if (p.cuisines.length && p.cuisines.includes(m.cuisine)) s += 5;

  // Portion ↔ calories
  if (p.goal === "gain" && m.kcal >= 700) s += 3;
  if (p.goal === "lose" && m.kcal <= 550) s += 3;
  if (p.goal === "maintain" && m.kcal >= 450 && m.kcal <= 850) s += 2;
  if (p.goal === "healthy" && (m.cuisine === "hl" || t.flavor === "fresh")) s += 3;

  const fit = budgetFit(m.basePrice, p.budget);
  if (fit === "in") s += 6;
  else if (fit === "near") s += 1;
  // "out" filtered before scoring

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

/**
 * Taste + budget recommendation engine.
 * 1) Hard-filter allergens + budget "out"
 * 2) Score by dish picks, protein/flavor/style, cuisine, diet, goal, budget
 * 3) Diversify restaurants so the week isn't one kitchen
 * 4) Rotate the top band by day for variety
 */
export function getMealsForDay(dayKey: string, count = 10): Meal[] {
  const prefs = readPrefs();
  const seed = hashSeed(dayKey);

  let filtered = mealPool.filter((m) => {
    if (prefs.allergens.some((a) => m.allergens.includes(a))) return false;
    if (prefs.budget && budgetFit(m.basePrice, prefs.budget) === "out") return false;
    // Veg-only protein preference hard-filters meat
    if (
      prefs.proteins.length === 1 &&
      prefs.proteins[0] === "veg" &&
      tasteOf(m).proteinFocus !== "veg"
    ) {
      return false;
    }
    return true;
  });

  // If budget emptied the pool, keep allergen filter only.
  if (!filtered.length) {
    filtered = mealPool.filter(
      (m) => !prefs.allergens.some((a) => m.allergens.includes(a)),
    );
  }

  // Deterministic shuffle then score-rank
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

  // Restaurant diversity pass
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
