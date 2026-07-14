// Client-side tracking helper.
//
// Everything the visitor enters is mirrored to Lovable Cloud so the Fylo team
// can see every phone number, preference, meal pick, delivery choice, feedback
// vote and saved meal in the backend dashboard.
//
// Design:
// - `syncLead()` upserts one row per visitor (keyed by fylo:visitorId).
//   Reads whatever we have in localStorage right now and pushes it up.
// - `logEvent()` appends a row to the events table for a single action.
// Both are fire-and-forget — failures never block the UI.

import { supabase } from "@/integrations/supabase/client";

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function visitorId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fylo:visitorId");
}

function phone(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userPhone");
}

export async function syncLead(): Promise<void> {
  if (typeof window === "undefined") return;
  const vid = visitorId();
  if (!vid) return; // nothing to key on yet

  const prefs = readJSON<Record<string, unknown>>("fylo:prefs", {});
  const saved = readJSON<string[]>("fylo:saved", []);
  const lunchByDay = readJSON<Record<string, string>>("fylo:lunchOrderedByDay", {});
  const deliveryByDay = readJSON<Record<string, unknown>>("fylo:deliveryByDay", {});
  const waitlistPositionRaw = localStorage.getItem("fylo:waitlistPosition");
  const referralCode = localStorage.getItem("fylo:referralCode");
  const attribution = readJSON<Record<string, unknown> | null>("fylo:attribution", null);
  const referredBy =
    (attribution && typeof (attribution as Record<string, unknown>).ref === "string"
      ? ((attribution as Record<string, unknown>).ref as string)
      : null) ?? null;

  const row = {
    visitor_id: vid,
    phone: phone(),
    referral_code: referralCode,
    referred_by: referredBy,
    waitlist_position: waitlistPositionRaw ? parseInt(waitlistPositionRaw, 10) : null,
    prefs: {
      ...prefs,
      attribution,
      lunchByDay,
      deliveryByDay,
    },
    saved_meals: saved,
    user_agent: navigator.userAgent,
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from("leads").upsert(row, { onConflict: "visitor_id" });
  } catch {
    /* offline / network — ignore */
  }
}

export async function logEvent(
  eventType: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  if (typeof window === "undefined") return;
  const vid = visitorId();
  if (!vid) return;
  try {
    await supabase.from("events").insert({
      visitor_id: vid,
      phone: phone(),
      event_type: eventType,
      payload,
    });
  } catch {
    /* ignore */
  }
}
