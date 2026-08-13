// Client-side tracking helper.
//
// Phone + email signups are written to `leads` (one row per visitor).
// Every action is also appended to `events`.

import { supabase } from "@/integrations/supabase/client";
import { isDevTestContact } from "@/lib/dev-test-contacts";

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

export type SubscribeResult =
  | { status: "new"; phone: string; email: string }
  | {
      status: "already_subscribed";
      phone: string;
      email: string;
      visitorId: string;
      hasPrefs: boolean;
    }
  | { status: "error"; message: string };

function normalizePhoneDigits(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("0")) d = `966${d.slice(1)}`;
  if (d.length === 9 && d.startsWith("5")) d = `966${d}`;
  return d;
}

function formatPhoneE164(raw: string): string {
  const d = normalizePhoneDigits(raw);
  return d ? `+${d}` : "";
}

/**
 * Saudi mobile numbers only:
 * 05XXXXXXXX · 5XXXXXXXX · +9665XXXXXXXX · 9665XXXXXXXX
 */
export function isValidSaudiMobile(raw: string): boolean {
  const d = normalizePhoneDigits(raw);
  return /^9665\d{8}$/.test(d);
}

/** Canonical local form for UI lists: 05XXXXXXXX */
export function formatSaudiMobileLocal(raw: string): string {
  const d = normalizePhoneDigits(raw);
  if (/^9665\d{8}$/.test(d)) return `0${d.slice(3)}`;
  return raw.trim();
}

export function phoneDigitsKey(raw: string): string {
  return normalizePhoneDigits(raw);
}

/** True if this phone already belongs to a waitlist lead. */
export async function isPhoneAlreadyRegistered(raw: string): Promise<boolean> {
  if (!isValidSaudiMobile(raw)) return false;
  const formatted = formatPhoneE164(raw);
  try {
    const { data, error } = await supabase.rpc("check_waitlist_subscription", {
      p_phone: formatted,
    });
    if (error) {
      console.warn("[isPhoneAlreadyRegistered]", error.message);
      return false;
    }
    if (data && typeof data === "object") {
      return Boolean((data as { subscribed?: boolean }).subscribed);
    }
  } catch (err) {
    console.warn("[isPhoneAlreadyRegistered]", err);
  }
  return false;
}

function reclaimLead(opts: {
  phone: string;
  email: string;
  visitorId: string;
  waitlistPosition?: number | null;
}): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("userPhone", opts.phone);
  localStorage.setItem("userEmail", opts.email);
  localStorage.setItem("fylo:visitorId", opts.visitorId);
  localStorage.setItem("fylo-visitor-id", opts.visitorId);
  localStorage.setItem("fylo:welcomed", "1");
  if (opts.waitlistPosition != null && Number.isFinite(opts.waitlistPosition)) {
    localStorage.setItem("fylo:waitlistPosition", String(opts.waitlistPosition));
  }
}

/** Persist a server-assigned waitlist rank locally for UI. */
export function storeWaitlistPosition(position: number | null | undefined): void {
  if (typeof window === "undefined") return;
  if (position == null || !Number.isFinite(position)) return;
  localStorage.setItem("fylo:waitlistPosition", String(position));
}

/** Read cached rank, or null if not assigned yet. */
export function readWaitlistPosition(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("fylo:waitlistPosition");
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

const INVITED_FRIENDS_KEY = "fylo:invitedFriends";
const WAITLIST_UNLOCKED_KEY = "fylo:waitlistUnlocked";

/** Friend phones this client invited (persists across navigation / reloads). */
export function readInvitedFriends(): string[] {
  const list = readJSON<unknown>(INVITED_FRIENDS_KEY, []);
  if (!Array.isArray(list)) return [];
  return list
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Save invited phones and unlock the waitlist rank once 3+ are stored. */
export function storeInvitedFriends(phones: string[]): void {
  if (typeof window === "undefined") return;
  const cleaned = phones.map((p) => p.trim()).filter(Boolean);
  localStorage.setItem(INVITED_FRIENDS_KEY, JSON.stringify(cleaned));
  if (cleaned.length >= 3) {
    localStorage.setItem(WAITLIST_UNLOCKED_KEY, "1");
  }
}

/** Whether this client has unlocked seeing their waitlist position. */
export function readWaitlistUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(WAITLIST_UNLOCKED_KEY) === "1") return true;
  return readInvitedFriends().length >= 3;
}

export function clearWaitlistInviteState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(INVITED_FRIENDS_KEY);
  localStorage.removeItem(WAITLIST_UNLOCKED_KEY);
}

/** Load this visitor's rank from Supabase (source of truth). */
export async function fetchWaitlistPosition(): Promise<number | null> {
  const vid = visitorId();
  if (!vid) return null;
  try {
    // leads is not readable by the Data API; a security-definer RPC returns
    // only this visitor's own rank.
    const { data, error } = await supabase.rpc("get_waitlist_position", {
      p_visitor_id: vid,
    });
    if (error) {
      console.warn("[fetchWaitlistPosition]", error.message);
      return null;
    }
    const pos = typeof data === "number" ? data : null;
    storeWaitlistPosition(pos ?? undefined);
    return pos;
  } catch (err) {
    console.warn("[fetchWaitlistPosition]", err);
    return null;
  }
}

/**
 * Ensure the lead row exists and return its server-assigned waitlist rank.
 * New signups get MAX(position)+1 in the database — not a local fake counter.
 * Visitors without phone/email are not counted on the waitlist.
 */
export async function ensureWaitlistPosition(): Promise<number | null> {
  const fromDb = await fetchWaitlistPosition();
  if (fromDb != null) return fromDb;

  // Only allocate a rank once someone has actually joined (phone or email).
  if (!phone() && !email()) return readWaitlistPosition();

  await syncLead();
  const again = await fetchWaitlistPosition();
  if (again != null) return again;
  return readWaitlistPosition();
}

/**
 * Join waitlist. Blocks if phone or email already belongs to another (or same) lead.
 */
export async function subscribeWaitlist(
  rawPhone: string,
  rawEmail: string,
): Promise<SubscribeResult> {
  if (typeof window === "undefined") {
    return { status: "error", message: "Unavailable" };
  }

  const formattedPhone = formatPhoneE164(rawPhone);
  const emailTrimmed = rawEmail.trim().toLowerCase();
  if (normalizePhoneDigits(rawPhone).length < 8) {
    return { status: "error", message: "Enter a valid phone number." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    return { status: "error", message: "Enter a valid email." };
  }

  const currentVid =
    localStorage.getItem("fylo:visitorId") ||
    localStorage.getItem("fylo-visitor-id") ||
    "";

  const isTest = isDevTestContact(formattedPhone, emailTrimmed);

  // Founder/dev allowlist: wipe prior TEST rows for this phone/email, then treat as new.
  if (isTest) {
    try {
      await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }>)("dev_reset_test_lead", {
        p_phone: formattedPhone,
        p_email: emailTrimmed,
      });
    } catch (err) {
      console.warn("[subscribeWaitlist] dev_reset_test_lead", err);
    }
    localStorage.removeItem("fylo:waitlistPosition");
    localStorage.removeItem("fylo:onboarded");
    localStorage.removeItem("fylo:prefs");
    clearWaitlistInviteState();
    // Fresh visitor id so we don't collide with an old lead row.
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}`;
    localStorage.setItem("fylo:visitorId", fresh);
    localStorage.setItem("fylo-visitor-id", fresh);
  }

  try {
    // Skip duplicate gate for allowlisted test contacts (after reset above).
    if (!isTest) {
      const { data, error } = await supabase.rpc("check_waitlist_subscription", {
        p_phone: formattedPhone,
        p_email: emailTrimmed,
      });

      if (!error && data && typeof data === "object") {
        const check = data as {
          subscribed?: boolean;
          visitor_id?: string;
          phone?: string | null;
          email?: string | null;
          has_prefs?: boolean;
          waitlist_position?: number | null;
        };

        if (check.subscribed && check.visitor_id) {
          const existingPhone = check.phone || formattedPhone;
          const existingEmail = check.email || emailTrimmed;
          const existingPos =
            typeof check.waitlist_position === "number"
              ? check.waitlist_position
              : null;
          reclaimLead({
            phone: existingPhone,
            email: existingEmail,
            visitorId: check.visitor_id,
            waitlistPosition: existingPos,
          });
          await logEvent("waitlist_already_subscribed_shown", {
            phone: existingPhone,
            email: existingEmail,
            existing_visitor_id: check.visitor_id,
            attempted_visitor_id: currentVid || null,
            waitlist_position: existingPos,
          });
          return {
            status: "already_subscribed",
            phone: existingPhone,
            email: existingEmail,
            visitorId: check.visitor_id,
            hasPrefs: Boolean(check.has_prefs),
          };
        }
      }
    }
  } catch (err) {
    console.warn("[subscribeWaitlist] check failed", err);
  }

  // New signup
  if (!localStorage.getItem("fylo:visitorId") && !localStorage.getItem("fylo-visitor-id")) {
    const { ensureVisitorId } = await import("@/lib/analytics");
    ensureVisitorId();
  }
  localStorage.setItem("userPhone", formattedPhone);
  localStorage.setItem("userEmail", emailTrimmed);
  localStorage.setItem("fylo:welcomed", "1");
  localStorage.setItem("fylo:phoneCapturedAt", new Date().toISOString());
  if (isTest) localStorage.setItem("fylo:isTestLead", "1");
  else localStorage.removeItem("fylo:isTestLead");

  const sync = await syncLead({ isTest });
  if (!sync.ok) {
    // Unique conflict = already subscribed (race / index)
    if (/unique|duplicate|23505/i.test(sync.message)) {
      reclaimLead({
        phone: formattedPhone,
        email: emailTrimmed,
        visitorId:
          localStorage.getItem("fylo:visitorId") ||
          localStorage.getItem("fylo-visitor-id") ||
          "",
      });
      return {
        status: "already_subscribed",
        phone: formattedPhone,
        email: emailTrimmed,
        visitorId:
          localStorage.getItem("fylo:visitorId") ||
          localStorage.getItem("fylo-visitor-id") ||
          "",
        hasPrefs: false,
      };
    }
    return { status: "error", message: sync.message };
  }

  // Pull the server-assigned rank (MAX+1) into localStorage for the waitlist UI.
  await fetchWaitlistPosition();

  await logEvent("waitlist_signup", {
    phone: formattedPhone,
    email: emailTrimmed,
    source: "welcome_landing",
    lead_synced: true,
    waitlist_position: readWaitlistPosition(),
    is_test: isTest,
  });

  return { status: "new", phone: formattedPhone, email: emailTrimmed };
}

/** Register / update the lead row for this visitor (phone + email = lead). */
export async function syncLead(opts?: { isTest?: boolean }): Promise<SyncLeadResult> {
  if (typeof window === "undefined") return { ok: false, message: "ssr" };
  const vid = visitorId();
  if (!vid) return { ok: false, message: "missing visitor id" };

  const prefs = readJSON<Record<string, unknown>>("fylo:prefs", {});
  const saved = readJSON<string[]>("fylo:saved", []);
  const lunchByDay = readJSON<Record<string, string>>("fylo:lunchOrderedByDay", {});
  const deliveryByDay = readJSON<Record<string, unknown>>("fylo:deliveryByDay", {});
  const referralCode = localStorage.getItem("fylo:referralCode");
  const attribution = readJSON<Record<string, unknown> | null>("fylo:attribution", null);
  const referredBy =
    (attribution && typeof (attribution as Record<string, unknown>).ref === "string"
      ? ((attribution as Record<string, unknown>).ref as string)
      : null) ?? null;

  const phoneVal = phone() ?? "";
  const emailVal = email() ?? "";
  const isTest =
    opts?.isTest === true ||
    localStorage.getItem("fylo:isTestLead") === "1" ||
    isDevTestContact(phoneVal, emailVal);

  const invitedFriends = readInvitedFriends();
  const prefsPayload = {
    ...prefs,
    attribution,
    lunchByDay,
    deliveryByDay,
    invitedFriends,
    waitlistUnlocked: readWaitlistUnlocked(),
  };

  try {
    // Do not send a client-made rank — the DB allocates the next unique position.
    const baseArgs = {
      p_visitor_id: vid,
      p_phone: phoneVal || undefined,
      p_email: emailVal || undefined,
      p_referral_code: referralCode ?? undefined,
      p_referred_by: referredBy ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_prefs: prefsPayload as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_saved_meals: saved as any,
      p_user_agent: navigator.userAgent,
    };

    let rpcError = (
      await supabase.rpc("upsert_lead", {
        ...baseArgs,
        p_is_test: Boolean(isTest),
      })
    ).error;

    // Older DBs may not have p_is_test yet — retry without it so join still works.
    if (
      rpcError &&
      /p_is_test|Could not find the function|schema cache/i.test(rpcError.message)
    ) {
      console.warn("[syncLead] upsert_lead missing p_is_test; retrying without it");
      rpcError = (await supabase.rpc("upsert_lead", baseArgs)).error;
    }

    if (!rpcError) {
      await fetchWaitlistPosition();
      return { ok: true };
    }
    console.error("[syncLead] upsert_lead rpc:", rpcError.message);
    return { ok: false, message: rpcError.message };
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
    const enriched = {
      ...payload,
      email: email() ?? payload.email,
      path: payload.path ?? window.location.pathname,
      referrer: document.referrer || null,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      screen:
        typeof window.screen?.width === "number"
          ? `${window.screen.width}x${window.screen.height}`
          : null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)("log_event", {
      p_visitor_id: vid,
      p_event_type: eventType,
      p_phone: phone() ?? undefined,
      p_payload: enriched,
    });
    if (error) console.error("[logEvent]", eventType, error.message);
  } catch {
    /* ignore */
  }
}
