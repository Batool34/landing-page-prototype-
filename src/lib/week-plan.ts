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

/** Round to 2 decimal places for SAR totals (avoids float display noise). */
export function roundSar(amount: number): number {
  return Math.round(amount * 100) / 100;
}

const STORAGE_ORDERS = "fylo:weekOrders";
const STORAGE_PAID = "fylo:weekPaidAt";
const STORAGE_PAID_WEEK = "fylo:weekPaidKey";

export type DayOrder = {
  mainMealId: string;
  extraMealIds: string[];
  /** Ids chosen by Surprise Extra (subset of extraMealIds). */
  surpriseExtraIds: string[];
};

export type SkippedDay = { status: "skipped" };

/** Planned lunch or explicit skip (no charge for that day). */
export type WeekDayEntry = DayOrder | SkippedDay;

export function isSkippedDay(entry: WeekDayEntry | undefined): boolean {
  return Boolean(entry && typeof entry === "object" && "status" in entry && entry.status === "skipped");
}

export function getDayOrder(entry: WeekDayEntry | undefined): DayOrder | undefined {
  if (!entry || isSkippedDay(entry)) return undefined;
  if (!entry.mainMealId) return undefined;
  return entry;
}

export function skippedDayMarker(): SkippedDay {
  return { status: "skipped" };
}

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
  return roundSar(sum);
}

export function isDayOrderComplete(entry: WeekDayEntry | DayOrder | null | undefined): boolean {
  const order = entry && "status" in entry ? getDayOrder(entry) : (entry as DayOrder | undefined);
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
  const dayTotal = roundSar(foodSubtotal + deliveryFee + serviceFee);
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

export function loadWeekOrders(): Partial<Record<WorkDayId, WeekDayEntry>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<WorkDayId, WeekDayEntry>>;
      return normalizeWeekEntries(parsed);
    }
  } catch {
    // ignore
  }
  try {
    const legacy = localStorage.getItem("fylo:lunchOrderedByDay");
    if (!legacy) return {};
    const map = JSON.parse(legacy) as Record<string, string>;
    const out: Partial<Record<WorkDayId, WeekDayEntry>> = {};
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

function normalizeWeekEntries(
  parsed: Partial<Record<WorkDayId, WeekDayEntry>>,
): Partial<Record<WorkDayId, WeekDayEntry>> {
  const out: Partial<Record<WorkDayId, WeekDayEntry>> = {};
  for (const day of WORK_DAYS) {
    const e = parsed[day];
    if (!e) continue;
    if (isSkippedDay(e)) {
      out[day] = skippedDayMarker();
      continue;
    }
    if (!e.mainMealId) continue;
    out[day] = {
      mainMealId: e.mainMealId,
      extraMealIds: e.extraMealIds ?? [],
      surpriseExtraIds: e.surpriseExtraIds ?? [],
    };
  }
  return out;
}

export function saveWeekOrders(orders: Partial<Record<WorkDayId, WeekDayEntry>>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_ORDERS, JSON.stringify(normalizeWeekEntries(orders)));
  const legacy: Record<string, string> = {};
  for (const day of WORK_DAYS) {
    const o = getDayOrder(orders[day]);
    if (o && isDayOrderComplete(o)) legacy[day] = o.mainMealId;
  }
  localStorage.setItem("fylo:lunchOrderedByDay", JSON.stringify(legacy));
  const active = localStorage.getItem("fylo:activeDay");
  const day = active && isWorkDay(active) ? active : "Sun";
  const current = getDayOrder(orders[day]);
  if (current && isDayOrderComplete(current)) {
    localStorage.setItem("fylo:lunchOrdered", current.mainMealId);
  } else {
    localStorage.removeItem("fylo:lunchOrdered");
  }
  window.dispatchEvent(new Event("fylo:lunchOrdered"));
}

export function countCompleteDays(orders: Partial<Record<WorkDayId, WeekDayEntry>>): number {
  return WORK_DAYS.filter((d) => isDayOrderComplete(orders[d])).length;
}

export function countSkippedDays(orders: Partial<Record<WorkDayId, WeekDayEntry>>): number {
  return WORK_DAYS.filter((d) => isSkippedDay(orders[d])).length;
}

export function weekFoodTotal(orders: Partial<Record<WorkDayId, WeekDayEntry>>): number {
  let sum = 0;
  for (const day of WORK_DAYS) {
    const o = getDayOrder(orders[day]);
    if (o && isDayOrderComplete(o)) sum += dayFoodSubtotal(o);
  }
  return roundSar(sum);
}

export function weekCheckoutTotal(orders: Partial<Record<WorkDayId, WeekDayEntry>>): number {
  let sum = 0;
  for (const day of WORK_DAYS) {
    const o = getDayOrder(orders[day]);
    if (o && isDayOrderComplete(o)) sum += dayPricing(o).dayTotal;
  }
  return roundSar(sum);
}

export function weekBreakdown(orders: Partial<Record<WorkDayId, WeekDayEntry>>) {
  let food = 0;
  let delivery = 0;
  let service = 0;
  for (const day of WORK_DAYS) {
    const o = getDayOrder(orders[day]);
    if (!o || !isDayOrderComplete(o)) continue;
    const p = dayPricing(o);
    food += p.foodSubtotal;
    delivery += p.deliveryFee;
    service += p.serviceFee;
  }
  const total = roundSar(food + delivery + service);
  return {
    food: roundSar(food),
    delivery: roundSar(delivery),
    service: roundSar(service),
    total,
  };
}

export function isWeekReadyForCheckout(orders: Partial<Record<WorkDayId, WeekDayEntry>>): boolean {
  return WORK_DAYS.every((d) => isDayOrderComplete(orders[d]) || isSkippedDay(orders[d]));
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
