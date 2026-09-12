/** Display helpers — show N/A when catalog data is missing. */

export function formatNa(value: string | number | null | undefined, na = "N/A"): string {
  if (value === null || value === undefined || value === "") return na;
  return String(value);
}

export function formatPrice(
  value: number | null | undefined,
  na = "N/A",
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return na;
  return String(value);
}

export function formatKcal(value: number | null | undefined, na = "N/A"): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return na;
  return String(Math.round(value));
}

export function formatMacroGram(
  value: number | null | undefined,
  na = "N/A",
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return na;
  return String(Math.round(value));
}
