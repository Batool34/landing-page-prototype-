export type MealVote = "up" | "down" | "neutral";

const KEY = "fylo:mealVotes";
const EVT = "fylo:mealVotes";

export function readMealVotes(): Record<string, MealVote | undefined> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, MealVote>;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, MealVote | undefined> = {};
    for (const [id, v] of Object.entries(parsed)) {
      if (v === "up" || v === "down" || v === "neutral") out[id] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function setMealVote(mealId: string, vote: MealVote | undefined) {
  if (typeof window === "undefined") return;
  const all = readMealVotes();
  if (vote === undefined) delete all[mealId];
  else all[mealId] = vote;
  localStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new Event(EVT));
}
