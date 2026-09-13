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

/** SAR totals for checkout — 2 dp when needed, no float junk (e.g. 426.09 not 426.09000000000003). */
export function formatSarAmount(value: number | null | undefined, na = "N/A"): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return na;
  const rounded = Math.round(value * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded));
  return rounded.toFixed(2);
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
