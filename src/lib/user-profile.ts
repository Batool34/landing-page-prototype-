export type StoredLocation = {
  city: string;
  lat?: number;
  lng?: number;
  capturedAt?: string;
};

export type UserProfile = {
  name: string | null;
  phone: string | null;
  city: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
};

export function readUserProfile(): UserProfile {
  const empty: UserProfile = {
    name: null,
    phone: null,
    city: null,
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
      budgetMin: typeof p.budgetMin === "number" ? p.budgetMin : null,
      budgetMax: typeof p.budgetMax === "number" ? p.budgetMax : null,
    };
  } catch {
    return empty;
  }
}

export function profileInitial(name: string | null): string {
  const n = name?.trim();
  if (!n) return "P";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return n.slice(0, 2).toUpperCase();
}
