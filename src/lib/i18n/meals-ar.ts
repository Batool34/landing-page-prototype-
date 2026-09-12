import type { Locale } from "./types";

/** Optional Arabic overrides; catalog names fall back to English from HungerStation. */
export const mealNamesAr: Record<string, string> = {};

export function getMealName(
  id: string,
  locale: Locale,
  fallback: string,
): string {
  if (locale === "ar") {
    return mealNamesAr[id] ?? fallback;
  }
  return fallback;
}
