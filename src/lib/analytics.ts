// Lightweight visitor + event tracking. Safe to call from anywhere.
// Silently fans out to dataLayer, gtag, and posthog if present.
// Also mirrors pageviews / dwell time into Supabase via tracking.ts.

import { logEvent } from "@/lib/tracking";

/** Canonical visitor id key used by syncLead / logEvent */
export const VISITOR_KEY = "fylo:visitorId";
const LEGACY_VISITOR_KEY = "fylo-visitor-id";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
  }
}

function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return "v-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Ensure a visitor id exists and migrate any legacy key. */
export function ensureVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v = localStorage.getItem(LEGACY_VISITOR_KEY);
    }
    if (!v) {
      v = uuid();
    }
    localStorage.setItem(VISITOR_KEY, v);
    localStorage.setItem(LEGACY_VISITOR_KEY, v);
    return v;
  } catch {
    return "";
  }
}

export function getVisitorId(): string {
  return ensureVisitorId();
}

export function trackEvent(event: string, payload: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const enriched = { ...payload, visitor_id: getVisitorId(), ts: Date.now() };
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...enriched });
  } catch {
    /* ignore */
  }
  try {
    window.gtag?.("event", event, enriched);
  } catch {
    /* ignore */
  }
  try {
    window.posthog?.capture(event, enriched);
  } catch {
    /* ignore */
  }
}

let dwellCleanup: (() => void) | null = null;

export function trackPageview(path?: string): void {
  if (typeof window === "undefined") return;
  const url = path ?? window.location.pathname + window.location.search;
  ensureVisitorId();
  trackEvent("pageview", { path: url });
  void logEvent("pageview", { path: url });

  // Replace any previous dwell-time listeners (SPA navigations)
  dwellCleanup?.();
  const enteredAt = Date.now();
  let flushed = false;
  const flush = () => {
    if (flushed) return;
    flushed = true;
    const duration_ms = Date.now() - enteredAt;
    void logEvent("page_leave", { path: url, duration_ms });
  };

  const onHide = () => {
    if (document.visibilityState === "hidden") flush();
  };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", flush);
  dwellCleanup = () => {
    flush();
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", flush);
  };
}
