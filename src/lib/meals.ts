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

export const meals: Meal[] = [
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
    basePrice: 38,
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
    basePrice: 52,
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
    basePrice: 64,
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
    basePrice: 22,
  },
];

export type Provider = {
  id: string;
  name: string;
  tone: string; // tailwind text color token utility
  bg: string; // tailwind bg color token utility
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
  return meals.find((m) => m.id === id);
}
