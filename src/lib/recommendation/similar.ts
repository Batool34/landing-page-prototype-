import { getMealById, mealPool, type Meal } from "@/lib/meals";
import { mealSimilarityScore } from "./features";
import { learningScoreForMeal } from "./taste";

export function getSimilarMeals(
  anchorMealId: string,
  limit = 6,
  excludeIds: Set<string> = new Set(),
): Meal[] {
  const anchor = getMealById(anchorMealId);
  if (!anchor) return [];

  const candidates = mealPool.filter(
    (m) =>
      m.menuRole !== "extra" &&
      m.id !== anchorMealId &&
      !excludeIds.has(m.id),
  );

  return candidates
    .map((m, i) => ({
      m,
      i,
      score: mealSimilarityScore(anchor, m) + learningScoreForMeal(m) * 0.15,
    }))
    .filter((x) => x.score > 2)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.m);
}

export function pickSimilarAnchorMeal(
  savedIds: string[],
  votes: Record<string, "up" | "down" | "neutral" | undefined>,
): Meal | null {
  const liked = Object.entries(votes).find(([, v]) => v === "up");
  if (liked) {
    const m = getMealById(liked[0]);
    if (m) return m;
  }
  for (const id of savedIds) {
    const m = getMealById(id);
    if (m) return m;
  }
  return null;
}
