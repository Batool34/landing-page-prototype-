import type { Meal } from "@/lib/meals";
import { mealFeatureKeys } from "./features";

const WEIGHTS_KEY = "fylo:tasteWeights";
const HYDRATED_KEY = "fylo:tasteHydrated";

export type TasteSignal =
  | "thumbs_up"
  | "thumbs_down"
  | "saved"
  | "unsaved"
  | "main_selected"
  | "order_confirmed";

type WeightDelta = Partial<Record<string, number>>;

const SIGNAL_DELTAS: Record<TasteSignal, WeightDelta> = {
  thumbs_up: {
    meal: 3,
    restaurant: 2,
    cuisine: 1.5,
    protein: 1,
    flavor: 0.75,
    style: 0.75,
  },
  thumbs_down: {
    meal: -4,
    restaurant: -2.5,
    cuisine: -1.5,
    protein: -1,
    flavor: -0.5,
    style: -0.5,
  },
  saved: {
    meal: 3,
    restaurant: 2,
    cuisine: 1,
    protein: 0.75,
    flavor: 0.5,
    style: 0.5,
  },
  unsaved: { meal: -0.5 },
  main_selected: {
    meal: 2,
    restaurant: 1.5,
    cuisine: 1,
    protein: 0.75,
    flavor: 0.5,
    style: 0.5,
  },
  order_confirmed: {
    meal: 4,
    restaurant: 2.5,
    cuisine: 2,
    protein: 1.25,
    flavor: 1,
    style: 1,
    price: 0.5,
  },
};

function prefixOf(key: string): string {
  const i = key.indexOf(":");
  return i === -1 ? key : key.slice(0, i);
}

export function readTasteWeights(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WEIGHTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTasteWeights(weights: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
  window.dispatchEvent(new Event("fylo:taste"));
}

function applySignal(weights: Record<string, number>, meal: Meal, signal: TasteSignal) {
  const deltas = SIGNAL_DELTAS[signal];
  const keys = mealFeatureKeys(meal);
  for (const key of keys) {
    const p = prefixOf(key);
    const delta = deltas[p] ?? (p === "meal" ? deltas.meal : undefined) ?? 0;
    if (!delta) continue;
    const next = (weights[key] ?? 0) + delta;
    if (Math.abs(next) < 0.05) delete weights[key];
    else weights[key] = Math.round(next * 100) / 100;
  }
}

/** Update taste weights from an explicit user or order signal. */
export function recordMealSignal(signal: TasteSignal, meal: Meal) {
  if (typeof window === "undefined") return;
  const weights = readTasteWeights();
  applySignal(weights, meal, signal);
  writeTasteWeights(weights);
}

/** Boost from learned weights (used in daily ranking). */
export function learningScoreForMeal(meal: Meal): number {
  const weights = readTasteWeights();
  if (!Object.keys(weights).length) return 0;
  let s = 0;
  for (const key of mealFeatureKeys(meal)) {
    const w = weights[key];
    if (w) s += w;
  }
  return Math.max(-12, Math.min(18, s));
}

export function hasLearnedTaste(): boolean {
  return Object.keys(readTasteWeights()).length > 0;
}

/** One-time backfill from saved meals and week orders (no analytics). */
export function hydrateTasteProfileOnce(
  savedIds: string[],
  resolveMeal: (id: string) => Meal | undefined,
  weekMainIds: string[],
) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(HYDRATED_KEY) === "1") return;
  const weights = readTasteWeights();
  for (const id of savedIds) {
    const m = resolveMeal(id);
    if (m) applySignal(weights, m, "saved");
  }
  for (const id of weekMainIds) {
    const m = resolveMeal(id);
    if (m) applySignal(weights, m, "order_confirmed");
  }
  writeTasteWeights(weights);
  localStorage.setItem(HYDRATED_KEY, "1");
}
