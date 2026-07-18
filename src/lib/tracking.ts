// Client-side tracking helper.
//
// Phone + email signups are written to `leads` (one row per visitor).
// Every action is also appended to `events`.

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
  return (
    localStorage.getItem("fylo:visitorId") ??
    localStorage.getItem("fylo-visitor-id")
  );
}

function phone(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userPhone");
}

function email(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userEmail");
}

export type SyncLeadResult = { ok: true } | { ok: false; message: string };

/** Register / update the lead row for this visitor (phone + email = lead). */
export async function syncLead(): Promise<SyncLeadResult> {
  if (typeof window === "undefined") return { ok: false, message: "ssr" };
  const vid = visitorId();
  if (!vid) return { ok: false, message: "missing visitor id" };

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

  const prefsPayload = {
    ...prefs,
    attribution,
    lunchByDay,
    deliveryByDay,
  };

  // Preferred path: SECURITY DEFINER RPC (works even if upsert+RLS is broken).
  try {
    const { error: rpcError } = await supabase.rpc("upsert_lead", {
      p_visitor_id: vid,
      p_phone: phone(),
      p_email: email(),
      p_referral_code: referralCode,
      p_referred_by: referredBy,
      p_waitlist_position: waitlistPositionRaw ? parseInt(waitlistPositionRaw, 10) : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_prefs: prefsPayload as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_saved_meals: saved as any,
      p_user_agent: navigator.userAgent,
    });

    if (!rpcError) return { ok: true };

    // Fall through to table upsert if RPC isn't deployed yet.
    console.warn("[syncLead] upsert_lead rpc:", rpcError.message);
  } catch (err) {
    console.warn("[syncLead] rpc threw", err);
  }

  const row = {
    visitor_id: vid,
    phone: phone(),
    email: email(),
    referral_code: referralCode,
    referred_by: referredBy,
    waitlist_position: waitlistPositionRaw ? parseInt(waitlistPositionRaw, 10) : null,
    prefs: prefsPayload,
    saved_meals: saved,
    user_agent: navigator.userAgent,
    updated_at: new Date().toISOString(),
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("leads").upsert(row as any, { onConflict: "visitor_id" });
    if (!error) return { ok: true };

    // Schema without email column yet — retry without email.
    if (/email/i.test(error.message)) {
      const { email: _omit, ...withoutEmail } = row;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const retry = await supabase.from("leads").upsert(withoutEmail as any, {
        onConflict: "visitor_id",
      });
      if (!retry.error) return { ok: true };
      console.error("[syncLead] upsert failed", retry.error);
      return { ok: false, message: retry.error.message };
    }

    console.error("[syncLead] upsert failed", error);
    return { ok: false, message: error.message };
  } catch (err) {
    const message = err instanceof Error ? err.message : "offline";
    console.error("[syncLead]", message);
    return { ok: false, message };
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
    const { error } = await supabase.from("events").insert({
      visitor_id: vid,
      phone: phone(),
      event_type: eventType,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: {
        ...payload,
        email: email() ?? payload.email,
        path: payload.path ?? window.location.pathname,
        referrer: document.referrer || null,
        language: navigator.language,
      } as any,
    });
    if (error) console.error("[logEvent]", eventType, error.message);
  } catch {
    /* ignore */
  }
}
