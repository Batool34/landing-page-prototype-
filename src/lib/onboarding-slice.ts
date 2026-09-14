/**
 * Small meal subset for onboarding only — avoids loading the full catalog (~5MB)
 * when users pick dishes during taste calibration.
 */
import slice from "@/generated/onboarding-slice.json";
import type { CuisineId, FlavorId, Meal, ProteinFocus, StyleId } from "@/lib/meals";

type SliceFile = {
  onboardingDishIds: string[];
  onboardingPairs: {
    pair1: { left: string; right: string };
    pair2: { left: string; right: string };
    pair3: { left: string; right: string };
  };
  meals: Meal[];
};

const data = slice as SliceFile;
const mealsById = new Map(data.meals.map((m) => [m.id, m]));

export function getOnboardingDishCards(): Pick<
  Meal,
  "id" | "name" | "restaurant" | "image" | "cuisine"
>[] {
  return data.onboardingDishIds
    .map((id) => mealsById.get(id))
    .filter((m): m is Meal => Boolean(m))
    .map((m) => ({
      id: m.id,
      name: m.name,
      restaurant: m.restaurant,
      image: m.image,
      cuisine: m.cuisine,
    }));
}

export function getOnboardingPairs() {
  return data.onboardingPairs;
}

export function getOnboardingMealById(id: string): Meal | undefined {
  return mealsById.get(id);
}

export type OnboardingMealTaste = {
  proteinFocus?: ProteinFocus;
  flavor?: FlavorId;
  style?: StyleId;
  cuisine?: CuisineId;
};
