import pancakes from "@/assets/meal-pancakes.jpg";
import chickenBowl from "@/assets/meal-chicken-bowl.jpg";
import poke from "@/assets/meal-poke.jpg";
import proteinBites from "@/assets/meal-protein-bites.jpg";

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
};

// Curated lunch pool — Phase 1 is lunch-only.
export const mealPool: Meal[] = [
  {
    id: "m1",
    slot: "Lunch · 12:30 PM",
    name: "Grilled Chicken & Jasmine Rice",
    restaurant: "Greenhouse Kitchen",
    kcal: 605, protein: 58, carbs: 51, fat: 19,
    image: chickenBowl, basePrice: 52, tag: "Top match",
  },
  {
    id: "m2",
    slot: "Lunch · 12:30 PM",
    name: "Wild Salmon Poke Bowl",
    restaurant: "Hokku",
    kcal: 540, protein: 41, carbs: 44, fat: 22,
    image: poke, basePrice: 64,
  },
  {
    id: "m3",
    slot: "Lunch · 12:30 PM",
    name: "Mediterranean Chicken Wrap",
    restaurant: "Olive & Vine",
    kcal: 520, protein: 38, carbs: 47, fat: 18,
    image: chickenBowl, basePrice: 38,
  },
  {
    id: "m4",
    slot: "Lunch · 12:30 PM",
    name: "Spicy Tuna Brown Rice Bowl",
    restaurant: "Hokku",
    kcal: 560, protein: 44, carbs: 52, fat: 16,
    image: poke, basePrice: 58,
  },
  {
    id: "m5",
    slot: "Lunch · 12:30 PM",
    name: "Quinoa Power Plate",
    restaurant: "Maison Cleo",
    kcal: 490, protein: 28, carbs: 58, fat: 14,
    image: pancakes, basePrice: 42,
  },
  {
    id: "m6",
    slot: "Lunch · 12:30 PM",
    name: "Beef Kofta with Hummus",
    restaurant: "Najd House",
    kcal: 640, protein: 49, carbs: 38, fat: 28,
    image: chickenBowl, basePrice: 55,
  },
  {
    id: "m7",
    slot: "Lunch · 12:30 PM",
    name: "Avocado Chicken Cobb",
    restaurant: "Greenhouse Kitchen",
    kcal: 470, protein: 42, carbs: 22, fat: 24,
    image: poke, basePrice: 46,
  },
  {
    id: "m8",
    slot: "Lunch · 12:30 PM",
    name: "Teriyaki Salmon Bento",
    restaurant: "Hokku",
    kcal: 580, protein: 46, carbs: 54, fat: 18,
    image: poke, basePrice: 62,
  },
  {
    id: "m9",
    slot: "Lunch · 12:30 PM",
    name: "Lean Turkey Mezze Box",
    restaurant: "Olive & Vine",
    kcal: 510, protein: 45, carbs: 40, fat: 17,
    image: chickenBowl, basePrice: 44,
  },
  {
    id: "m10",
    slot: "Lunch · 12:30 PM",
    name: "Lentil & Roasted Veg Bowl",
    restaurant: "Pantry Co.",
    kcal: 430, protein: 24, carbs: 56, fat: 12,
    image: proteinBites, basePrice: 36,
  },
  {
    id: "m11",
    slot: "Lunch · 12:30 PM",
    name: "Harissa Chicken Couscous",
    restaurant: "Najd House",
    kcal: 590, protein: 47, carbs: 55, fat: 18,
    image: chickenBowl, basePrice: 48,
  },
  {
    id: "m12",
    slot: "Lunch · 12:30 PM",
    name: "Shrimp & Mango Salad",
    restaurant: "Hokku",
    kcal: 410, protein: 36, carbs: 32, fat: 14,
    image: poke, basePrice: 54,
  },
];

// Backward-compat export used elsewhere.
export const meals = mealPool.slice(0, 5);

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
  const seed = hashSeed(dayKey);
  const arr = [...mealPool];
  // Fisher-Yates with seeded PRNG
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const picked = arr.slice(0, count);
  // Promote a "Top match" tag to the first card only.
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
