import type { LocationGeoDetails } from "@/lib/geocode";

export type StoredLocation = {
  city: string;
  district?: string | null;
  capturedAt?: string;
  /** Coordinates and raw geo — synced to backend via prefs; not shown in UI. */
  geo?: LocationGeoDetails;
};

export type UserProfile = {
  name: string | null;
  phone: string | null;
  city: string | null;
  district: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
};

export function readUserProfile(): UserProfile {
  const empty: UserProfile = {
    name: null,
    phone: null,
    city: null,
    district: null,
    budgetMin: null,
    budgetMax: null,
  };
  if (typeof window === "undefined") return empty;
  try {
    const phone = localStorage.getItem("userPhone");
    const raw = localStorage.getItem("fylo:prefs");
    if (!raw) {
      return { ...empty, phone };
    }
    const p = JSON.parse(raw) as {
      name?: string;
      phone?: string;
      budgetMin?: number;
      budgetMax?: number;
      location?: StoredLocation;
    };
    return {
      name: p.name?.trim() || null,
      phone: phone || p.phone || null,
      city: p.location?.city?.trim() || null,
      district: p.location?.district?.trim() || null,
      budgetMin: typeof p.budgetMin === "number" ? p.budgetMin : null,
      budgetMax: typeof p.budgetMax === "number" ? p.budgetMax : null,
    };
  } catch {
    return empty;
  }
}

export const PROFILE_BUDGET_MIN = 30;
export const PROFILE_BUDGET_MAX = 300;

function budgetIdFromRange(min: number, max: number): "value" | "std" | "premium" {
  if (max <= 50) return "value";
  if (max <= 120) return "std";
  return "premium";
}

export type UserProfilePatch = {
  name?: string;
  phone?: string;
  /** Lunch budget ceiling (min food order floor stays 30 SAR). */
  budgetMax?: number;
};

export function saveUserProfile(patch: UserProfilePatch): UserProfile {
  if (typeof window === "undefined") return readUserProfile();

  let prefs: Record<string, unknown> = {};
  try {
    const raw = localStorage.getItem("fylo:prefs");
    if (raw) prefs = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    /* start fresh merge */
  }

  if (patch.name !== undefined) prefs.name = patch.name.trim();
  if (patch.phone !== undefined) {
    const p = patch.phone.trim();
    prefs.phone = p;
    if (p) localStorage.setItem("userPhone", p);
  }
  if (patch.budgetMax !== undefined) {
    prefs.budgetMax = patch.budgetMax;
    prefs.budgetMin = PROFILE_BUDGET_MIN;
    prefs.budget = budgetIdFromRange(PROFILE_BUDGET_MIN, patch.budgetMax);
  }

  localStorage.setItem("fylo:prefs", JSON.stringify(prefs));
  window.dispatchEvent(new Event("fylo:prefsUpdated"));
  return readUserProfile();
}

export function formatLocationLabel(city: string | null, district: string | null): string | null {
  const c = city?.trim();
  const d = district?.trim();
  if (c && d) return `${c} · ${d}`;
  return c || d || null;
}

export function profileInitial(name: string | null): string {
  const n = name?.trim();
  if (!n) return "P";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return n.slice(0, 2).toUpperCase();
}
