import {
  getMealById,
  hungerStationQuote,
  mealPool,
  readPrefs,
  type BudgetId,
  type Meal,
} from "@/lib/meals";

export const WORK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu"] as const;
export type WorkDayId = (typeof WORK_DAYS)[number];

export const MIN_FOOD_SAR = 30;

const STORAGE_ORDERS = "fylo:weekOrders";
const STORAGE_PAID = "fylo:weekPaidAt";
const STORAGE_PAID_WEEK = "fylo:weekPaidKey";

export type DayOrder = {
  mainMealId: string;
  extraMealIds: string[];
  /** Ids chosen by Surprise Extra (subset of extraMealIds). */
  surpriseExtraIds: string[];
};

export type DayPricing = {
  foodSubtotal: number;
  deliveryFee: number;
  serviceFee: number;
  dayTotal: number;
};

export function isWorkDay(day: string): day is WorkDayId {
  return (WORK_DAYS as readonly string[]).includes(day);
}

export function inferMenuRoleFromCategory(category?: string, name?: string): "main" | "extra" {
  const c = (category || "").toLowerCase().trim();
  const n = (name || "").toLowerCase();
  const extraExact = new Set([
    "sides",
    "desserts",
    "drinks",
    "cold drinks",
    "hot drinks",
    "beverages",
    "sauces",
    "appetizers",
    "sweets",
    "soft drinks",
    "juices",
    "hot beverages",
    "cold beverages",
  ]);
  if (extraExact.has(c)) return "extra";
  if (/drink|beverage|juice|dessert|sweet|sauce|side|appetizer|coffee|shake|kunafa|cocktail/i.test(c)) {
    return "extra";
  }
  if (/salad/i.test(c) && !/meal|box|platter/i.test(n)) return "extra";
  return "main";
}

export function menuRoleOf(m: Meal): "main" | "extra" {
  if (m.menuRole === "main" || m.menuRole === "extra") return m.menuRole;
  return inferMenuRoleFromCategory(m.category, m.name);
}

const extrasCache = new Map<string, Meal[]>();

export function getExtrasForRestaurant(restaurantSlug: string, excludeIds: Set<string> = new Set()): Meal[] {
  if (!extrasCache.has(restaurantSlug)) {
    const list = mealPool.filter(
      (m) =>
        m.restaurantSlug === restaurantSlug &&
        menuRoleOf(m) === "extra" &&
        m.basePrice != null &&
        m.basePrice > 0,
    );
    list.sort((a, b) => (a.basePrice ?? 0) - (b.basePrice ?? 0));
    extrasCache.set(restaurantSlug, list);
  }
  return extrasCache.get(restaurantSlug)!.filter((m) => !excludeIds.has(m.id));
}

export function mealFoodPrice(m: Meal | undefined | null): number {
  if (!m?.basePrice) return 0;
  return m.basePrice;
}

export function dayFoodSubtotal(order: DayOrder): number {
  const ids = [order.mainMealId, ...order.extraMealIds];
  let sum = 0;
  for (const id of ids) {
    sum += mealFoodPrice(getMealById(id));
  }
  return Math.round(sum * 100) / 100;
}

export function isDayOrderComplete(order: DayOrder | null | undefined): boolean {
  if (!order?.mainMealId) return false;
  return dayFoodSubtotal(order) >= MIN_FOOD_SAR;
}

export function dayPricing(order: DayOrder): DayPricing {
  const foodSubtotal = dayFoodSubtotal(order);
  const main = getMealById(order.mainMealId);
  const quote = main ? hungerStationQuote(main) : null;
  const deliveryFee = quote?.deliveryFee ?? 9;
  const serviceFeePct = quote?.serviceFeePct ?? 0.05;
  const serviceFee = Math.round(foodSubtotal * serviceFeePct);
  const dayTotal = foodSubtotal + deliveryFee + serviceFee;
  return { foodSubtotal, deliveryFee, serviceFee, dayTotal };
}

export function gapToMinimum(order: DayOrder): number {
  const gap = MIN_FOOD_SAR - dayFoodSubtotal(order);
  return gap > 0 ? Math.ceil(gap) : 0;
}

function budgetExtraCap(budget: BudgetId | null): number {
  if (budget === "value") return 12;
  if (budget === "premium") return 22;
  return 16;
}

function scoreExtra(m: Meal, main: Meal): number {
  const prefs = readPrefs();
  let s = 0;
  if (prefs.dishPicks.includes(m.id)) s += 8;
  if (m.cuisine === main.cuisine) s += 2;
  if (prefs.proteins.length && m.proteinFocus && prefs.proteins.includes(m.proteinFocus)) s += 3;
  return s;
}

function pickToReachGap(candidates: Meal[], gap: number, maxItems = 3): Meal[] {
  if (gap <= 0 || !candidates.length) return [];
  const sorted = [...candidates].sort((a, b) => (a.basePrice ?? 0) - (b.basePrice ?? 0));
  const single = sorted.find((m) => (m.basePrice ?? 0) >= gap);
  if (single) return [single];

  const picked: Meal[] = [];
  let sum = 0;
  for (const m of sorted) {
    if (picked.length >= maxItems) break;
    picked.push(m);
    sum += m.basePrice ?? 0;
    if (sum >= gap) return picked;
  }
  return picked;
}

/** Pick surprise extras from the same restaurant; respects budget and min order gap. */
export function pickSurpriseExtras(
  main: Meal,
  currentOrder: DayOrder,
): { ids: string[]; meals: Meal[] } {
  const gap = gapToMinimum(currentOrder);
  const prefs = readPrefs();
  const cap = Math.max(gap, budgetExtraCap(prefs.budget));
  const used = new Set([currentOrder.mainMealId, ...currentOrder.extraMealIds]);
  let candidates = getExtrasForRestaurant(main.restaurantSlug, used).filter(
    (m) => (m.basePrice ?? 0) <= cap,
  );
  if (!candidates.length) {
    candidates = getExtrasForRestaurant(main.restaurantSlug, used).slice(0, 40);
  }
  candidates.sort((a, b) => scoreExtra(b, main) - scoreExtra(a, main) || (a.basePrice ?? 0) - (b.basePrice ?? 0));

  const targetGap = gap > 0 ? gap : Math.min(cap, budgetExtraCap(prefs.budget));
  const picked =
    gap > 0
      ? pickToReachGap(candidates, targetGap, 3)
      : candidates.length
        ? [candidates[0]]
        : [];

  return { ids: picked.map((m) => m.id), meals: picked };
}

export function loadWeekOrders(): Partial<Record<WorkDayId, DayOrder>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<WorkDayId, DayOrder>>;
      return normalizeOrders(parsed);
    }
  } catch {
    // ignore
  }
  try {
    const legacy = localStorage.getItem("fylo:lunchOrderedByDay");
    if (!legacy) return {};
    const map = JSON.parse(legacy) as Record<string, string>;
    const out: Partial<Record<WorkDayId, DayOrder>> = {};
    for (const day of WORK_DAYS) {
      const mainId = map[day];
      if (mainId) {
        out[day] = { mainMealId: mainId, extraMealIds: [], surpriseExtraIds: [] };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function normalizeOrders(
  parsed: Partial<Record<WorkDayId, DayOrder>>,
): Partial<Record<WorkDayId, DayOrder>> {
  const out: Partial<Record<WorkDayId, DayOrder>> = {};
  for (const day of WORK_DAYS) {
    const o = parsed[day];
    if (!o?.mainMealId) continue;
    out[day] = {
      mainMealId: o.mainMealId,
      extraMealIds: o.extraMealIds ?? [],
      surpriseExtraIds: o.surpriseExtraIds ?? [],
    };
  }
  return out;
}

export function saveWeekOrders(orders: Partial<Record<WorkDayId, DayOrder>>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_ORDERS, JSON.stringify(normalizeOrders(orders)));
  const legacy: Record<string, string> = {};
  for (const day of WORK_DAYS) {
    const o = orders[day];
    if (o?.mainMealId && isDayOrderComplete(o)) legacy[day] = o.mainMealId;
  }
  localStorage.setItem("fylo:lunchOrderedByDay", JSON.stringify(legacy));
  const active = localStorage.getItem("fylo:activeDay");
  const day = active && isWorkDay(active) ? active : "Sun";
  const current = orders[day];
  if (current?.mainMealId && isDayOrderComplete(current)) {
    localStorage.setItem("fylo:lunchOrdered", current.mainMealId);
  }
  window.dispatchEvent(new Event("fylo:lunchOrdered"));
}

export function countCompleteDays(orders: Partial<Record<WorkDayId, DayOrder>>): number {
  return WORK_DAYS.filter((d) => isDayOrderComplete(orders[d])).length;
}

export function weekFoodTotal(orders: Partial<Record<WorkDayId, DayOrder>>): number {
  let sum = 0;
  for (const day of WORK_DAYS) {
    const o = orders[day];
    if (o && isDayOrderComplete(o)) sum += dayFoodSubtotal(o);
  }
  return Math.round(sum * 100) / 100;
}

export function weekCheckoutTotal(orders: Partial<Record<WorkDayId, DayOrder>>): number {
  let sum = 0;
  for (const day of WORK_DAYS) {
    const o = orders[day];
    if (o && isDayOrderComplete(o)) sum += dayPricing(o).dayTotal;
  }
  return sum;
}

export function weekBreakdown(orders: Partial<Record<WorkDayId, DayOrder>>) {
  let food = 0;
  let delivery = 0;
  let service = 0;
  for (const day of WORK_DAYS) {
    const o = orders[day];
    if (!o || !isDayOrderComplete(o)) continue;
    const p = dayPricing(o);
    food += p.foodSubtotal;
    delivery += p.deliveryFee;
    service += p.serviceFee;
  }
  return {
    food,
    delivery,
    service,
    total: food + delivery + service,
  };
}

export function isWeekReadyForCheckout(orders: Partial<Record<WorkDayId, DayOrder>>): boolean {
  return WORK_DAYS.every((d) => isDayOrderComplete(orders[d]));
}

export function currentWeekKey(): string {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? 0 : day;
  start.setDate(start.getDate() - diff);
  return start.toISOString().slice(0, 10);
}

export function isWeekPaid(): boolean {
  if (typeof window === "undefined") return false;
  const paidAt = localStorage.getItem(STORAGE_PAID);
  const paidKey = localStorage.getItem(STORAGE_PAID_WEEK);
  return Boolean(paidAt && paidKey === currentWeekKey());
}

export function markWeekPaid() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PAID, new Date().toISOString());
  localStorage.setItem(STORAGE_PAID_WEEK, currentWeekKey());
}
