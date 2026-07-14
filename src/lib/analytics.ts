// Lightweight visitor + event tracking. Safe to call from anywhere.
// Silently fans out to dataLayer, gtag, and posthog if present.

const VISITOR_KEY = "fylo-visitor-id";

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

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v = uuid();
      localStorage.setItem(VISITOR_KEY, v);
    }
    return v;
  } catch {
    return "";
  }
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

export function trackPageview(path?: string): void {
  if (typeof window === "undefined") return;
  const url = path ?? window.location.pathname + window.location.search;
  trackEvent("pageview", { path: url });
}
