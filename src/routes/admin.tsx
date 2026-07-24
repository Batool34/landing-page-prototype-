import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAdminData } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Picky" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminDashboard,
});

type Lead = {
  visitor_id: string;
  phone: string | null;
  email: string | null;
  waitlist_position: number | null;
  user_agent: string | null;
  prefs: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  visitor_id: string;
  phone: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type Tab = "overview" | "validate" | "leads" | "traffic" | "activity";

const SESSION_KEY = "picky:admin_ok";

function getExpectedPassword(): string {
  const raw = import.meta.env.VITE_ADMIN_PASSWORD;
  return typeof raw === "string" ? raw.trim() : "";
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

function parseDevice(ua: string | null | undefined): "Desktop" | "Mobile" | "Tablet" | "Other" {
  if (!ua) return "Other";
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|Android.*Mobile|iPhone/i.test(ua)) return "Mobile";
  if (/Windows|Macintosh|Linux|CrOS/i.test(ua)) return "Desktop";
  return "Other";
}

function sourceFromPayload(payload: Record<string, unknown>): string {
  const ref = typeof payload.referrer === "string" ? payload.referrer : "";
  if (!ref) return "Direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (!host) return "Direct";
    return host;
  } catch {
    return "Direct";
  }
}

function pathFromPayload(payload: Record<string, unknown>): string {
  const path = typeof payload.path === "string" ? payload.path : "/";
  return path.split("?")[0] || "/";
}

function localeFromPayload(payload: Record<string, unknown>): string {
  const lang = typeof payload.language === "string" ? payload.language : "";
  return lang || "Unknown";
}

function hasPrefs(prefs: Record<string, unknown> | null): boolean {
  if (!prefs) return false;
  const keys = Object.keys(prefs).filter(
    (k) => k !== "attribution" && k !== "lunchByDay" && k !== "deliveryByDay",
  );
  return keys.length > 0;
}

/** e.g. 257 -> "4m 17s", 42 -> "42s" */
function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "0s";
  const total = Math.round(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function toCountRows(m: Map<string, number>): { label: string; count: number }[] {
  return [...m.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function AdminDashboard() {
  const expected = getExpectedPassword();
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [leadQuery, setLeadQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const pwd =
        password.trim() ||
        (typeof window !== "undefined"
          ? sessionStorage.getItem("picky:admin_pwd") ?? ""
          : "");
      if (!pwd) throw new Error("Enter admin password to load data.");

      const { leads: leadRows, events: eventRows } = await fetchAdminData({
        data: { password: pwd },
      });

      setLeads(
        (leadRows ?? []).map((l) => ({
          visitor_id: String(l.visitor_id ?? ""),
          phone: (l.phone as string | null) ?? null,
          email: (l.email as string | null) ?? null,
          waitlist_position: (l.waitlist_position as number | null) ?? null,
          user_agent: (l.user_agent as string | null) ?? null,
          prefs:
            l.prefs && typeof l.prefs === "object" && !Array.isArray(l.prefs)
              ? (l.prefs as Record<string, unknown>)
              : null,
          created_at: String(l.created_at ?? ""),
          updated_at: String(l.updated_at ?? ""),
        })),
      );
      setEvents(
        (eventRows ?? []).map((e) => ({
          id: String(e.id ?? ""),
          visitor_id: String(e.visitor_id ?? ""),
          phone: (e.phone as string | null) ?? null,
          event_type: String(e.event_type ?? ""),
          payload:
            e.payload && typeof e.payload === "object" && !Array.isArray(e.payload)
              ? (e.payload as Record<string, unknown>)
              : {},
          created_at: String(e.created_at ?? ""),
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (authed) void load();
  }, [authed]);

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expected) {
      setError(
        'Set VITE_ADMIN_PASSWORD in .env (e.g. VITE_ADMIN_PASSWORD="MySecret123"), then rebuild/refresh preview.',
      );
      return;
    }
    if (password.trim() !== expected) {
      setError("Wrong password.");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    setAuthed(true);
    setError(null);
  };

  // Merge DB leads + signups recovered from events (so empty leads table still shows people).
  const allLeads = useMemo(() => {
    const map = new Map<string, Lead & { source: "leads" | "events" }>();

    for (const l of leads) {
      map.set(l.visitor_id, { ...l, source: "leads" });
    }

    for (const ev of events) {
      if (
        ev.event_type !== "waitlist_signup" &&
        ev.event_type !== "phone_captured" &&
        ev.event_type !== "onboarding_completed"
      ) {
        continue;
      }
      const phone =
        ev.phone ||
        (typeof ev.payload.phone === "string" ? ev.payload.phone : null);
      const email =
        typeof ev.payload.email === "string" ? ev.payload.email : null;
      if (!phone && !email) continue;

      const existing = map.get(ev.visitor_id);
      if (!existing) {
        map.set(ev.visitor_id, {
          visitor_id: ev.visitor_id,
          phone,
          email,
          waitlist_position: null,
          user_agent: null,
          prefs: null,
          created_at: ev.created_at,
          updated_at: ev.created_at,
          source: "events",
        });
      } else {
        map.set(ev.visitor_id, {
          ...existing,
          phone: existing.phone || phone,
          email: existing.email || email,
        });
      }
    }

    return [...map.values()].sort(
      (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
    );
  }, [leads, events]);

  const stats = useMemo(() => {
    const visitors = new Set(events.map((e) => e.visitor_id));
    const pageviews = events.filter((e) => e.event_type === "pageview").length;
    const leaves = events.filter((e) => e.event_type === "page_leave");
    const totalDwell = leaves.reduce(
      (s, e) => s + (typeof e.payload.duration_ms === "number" ? e.payload.duration_ms : 0),
      0,
    );
    const avgDwellSec = leaves.length ? Math.round(totalDwell / leaves.length / 1000) : 0;
    const viewsPerVisit = visitors.size ? +(pageviews / visitors.size).toFixed(2) : 0;

    // Bounce-ish: single pageview visitors / visitors
    const viewsByVisitor = new Map<string, number>();
    for (const e of events) {
      if (e.event_type !== "pageview") continue;
      viewsByVisitor.set(e.visitor_id, (viewsByVisitor.get(e.visitor_id) ?? 0) + 1);
    }
    let bounced = 0;
    for (const v of visitors) {
      if ((viewsByVisitor.get(v) ?? 0) <= 1) bounced += 1;
    }
    const bounceRate = visitors.size ? Math.round((bounced / visitors.size) * 100) : 0;

    const signupEvents = events.filter((e) => e.event_type === "waitlist_signup");
    const onboarded = events.filter((e) => e.event_type === "onboarding_completed").length;
    const meals = events.filter((e) => e.event_type === "meal_chosen").length;
    const withPhone = allLeads.filter((l) => l.phone).length;
    const withEmail = allLeads.filter((l) => l.email).length;
    const calibrated = leads.filter((l) => hasPrefs(l.prefs)).length;

    const days = lastNDays(14);
    const visitorsByDay = new Map(days.map((d) => [d, new Set<string>()]));
    const signupsByDay = new Map(days.map((d) => [d, 0]));
    for (const e of events) {
      const d = dayKey(e.created_at);
      visitorsByDay.get(d)?.add(e.visitor_id);
      if (e.event_type === "waitlist_signup") {
        signupsByDay.set(d, (signupsByDay.get(d) ?? 0) + 1);
      }
    }

    const sourceCounts = new Map<string, number>();
    const pageCounts = new Map<string, { views: number; dwellMs: number; dwellN: number }>();
    const localeCounts = new Map<string, number>();
    for (const e of events) {
      const locale = localeFromPayload(e.payload);
      localeCounts.set(locale, (localeCounts.get(locale) ?? 0) + 1);
      if (e.event_type === "pageview") {
        const src = sourceFromPayload(e.payload);
        sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
        const path = pathFromPayload(e.payload);
        const cur = pageCounts.get(path) ?? { views: 0, dwellMs: 0, dwellN: 0 };
        cur.views += 1;
        pageCounts.set(path, cur);
      }
      if (e.event_type === "page_leave") {
        const path = pathFromPayload(e.payload);
        const cur = pageCounts.get(path) ?? { views: 0, dwellMs: 0, dwellN: 0 };
        const ms = typeof e.payload.duration_ms === "number" ? e.payload.duration_ms : 0;
        if (ms > 0) {
          cur.dwellMs += ms;
          cur.dwellN += 1;
        }
        pageCounts.set(path, cur);
      }
    }

    const deviceCounts = new Map<string, number>();
    for (const l of leads) {
      const d = parseDevice(l.user_agent);
      deviceCounts.set(d, (deviceCounts.get(d) ?? 0) + 1);
    }
    // If no lead UAs yet, fall back to counting unique visitors as unknown
    if (deviceCounts.size === 0 && visitors.size) {
      deviceCounts.set("Unknown", visitors.size);
    }
    const deviceTotal = [...deviceCounts.values()].reduce((a, b) => a + b, 0) || 1;
    const localeTotal = [...localeCounts.values()].reduce((a, b) => a + b, 0) || 1;

    const eventTypeCounts = new Map<string, number>();
    for (const e of events) {
      eventTypeCounts.set(e.event_type, (eventTypeCounts.get(e.event_type) ?? 0) + 1);
    }

    return {
      visitors: visitors.size,
      pageviews,
      viewsPerVisit,
      avgDwellSec,
      bounceRate,
      signupCount: Math.max(signupEvents.length, allLeads.length),
      withPhone,
      withEmail,
      onboarded,
      meals,
      calibrated,
      dbLeads: leads.length,
      visitorsChart: days.map((day) => ({
        day,
        visitors: visitorsByDay.get(day)?.size ?? 0,
        signups: signupsByDay.get(day) ?? 0,
      })),
      sources: [...sourceCounts.entries()]
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      pages: [...pageCounts.entries()]
        .map(([path, v]) => ({
          path,
          views: v.views,
          avgDwell: v.dwellN ? Math.round(v.dwellMs / v.dwellN / 1000) : 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10),
      devices: [...deviceCounts.entries()]
        .map(([device, count]) => ({
          device,
          count,
          pct: Math.round((count / deviceTotal) * 1000) / 10,
        }))
        .sort((a, b) => b.count - a.count),
      locales: [...localeCounts.entries()]
        .map(([locale, count]) => ({
          locale,
          count,
          pct: Math.round((count / localeTotal) * 1000) / 10,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      funnel: [
        { step: "Visited", count: visitors.size },
        { step: "Waitlist signup", count: Math.max(signupEvents.length, allLeads.filter((l) => l.phone || l.email).length) },
        { step: "Onboarding done", count: onboarded },
        { step: "Meal chosen", count: meals },
      ],
      eventTypes: [...eventTypeCounts.entries()]
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
    };
  }, [events, leads, allLeads]);

  // Advanced idea-validation metrics: funnel %, retention, attribution, prefs, engagement.
  const validateStats = useMemo(() => {
    const visited = stats.visitors;
    const signup = stats.signupCount;
    const onboarded = stats.onboarded;
    const mealChosenCount = stats.meals;

    const funnelSteps = [
      { step: "Visited", count: visited },
      { step: "Waitlist signup", count: signup },
      { step: "Onboarding done", count: onboarded },
      { step: "Meal chosen", count: mealChosenCount },
    ];
    const funnel = funnelSteps.map((s) => ({
      ...s,
      pctOfVisited: visited ? Math.round((s.count / visited) * 100) : 0,
    }));

    const visitToSignupRate = visited ? Math.round((signup / visited) * 100) : 0;
    const signupToOnboardedRate = signup ? Math.round((onboarded / signup) * 100) : 0;
    const onboardedToMealRate = onboarded ? Math.round((mealChosenCount / onboarded) * 100) : 0;

    const days = lastNDays(14);
    const signupsByDay = new Map(days.map((d) => [d, 0]));
    for (const e of events) {
      if (e.event_type !== "waitlist_signup") continue;
      const d = dayKey(e.created_at);
      if (signupsByDay.has(d)) signupsByDay.set(d, (signupsByDay.get(d) ?? 0) + 1);
    }
    const signupsPerDay = days.map((day) => ({ day, signups: signupsByDay.get(day) ?? 0 }));

    const daysByVisitor = new Map<string, Set<string>>();
    for (const e of events) {
      const set = daysByVisitor.get(e.visitor_id) ?? new Set<string>();
      set.add(dayKey(e.created_at));
      daysByVisitor.set(e.visitor_id, set);
    }
    let returningVisitors = 0;
    for (const set of daysByVisitor.values()) {
      if (set.size >= 2) returningVisitors += 1;
    }

    const duplicateAttempts = events.filter(
      (e) => e.event_type === "waitlist_already_subscribed_shown",
    ).length;

    const pageviewsByVisitor = new Map<string, EventRow[]>();
    for (const e of events) {
      if (e.event_type !== "pageview") continue;
      const arr = pageviewsByVisitor.get(e.visitor_id) ?? [];
      arr.push(e);
      pageviewsByVisitor.set(e.visitor_id, arr);
    }
    for (const arr of pageviewsByVisitor.values()) {
      arr.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    }

    const firstSignupByVisitor = new Map<string, EventRow>();
    for (const e of events) {
      if (e.event_type !== "waitlist_signup") continue;
      const existing = firstSignupByVisitor.get(e.visitor_id);
      if (!existing || +new Date(e.created_at) < +new Date(existing.created_at)) {
        firstSignupByVisitor.set(e.visitor_id, e);
      }
    }

    const pagesBeforeSignup: number[] = [];
    const minutesToSignup: number[] = [];
    const signupSourceCounts = new Map<string, number>();
    for (const [visitorId, signupEvent] of firstSignupByVisitor) {
      const pvs = pageviewsByVisitor.get(visitorId) ?? [];
      const signupTime = +new Date(signupEvent.created_at);
      pagesBeforeSignup.push(pvs.filter((p) => +new Date(p.created_at) <= signupTime).length);

      const source = pvs.length ? sourceFromPayload(pvs[0].payload) : sourceFromPayload(signupEvent.payload);
      signupSourceCounts.set(source, (signupSourceCounts.get(source) ?? 0) + 1);

      if (pvs.length) {
        const firstPv = +new Date(pvs[0].created_at);
        if (signupTime >= firstPv) {
          minutesToSignup.push((signupTime - firstPv) / 60000);
        }
      }
    }
    const avgPagesBeforeSignup = pagesBeforeSignup.length
      ? +(pagesBeforeSignup.reduce((a, b) => a + b, 0) / pagesBeforeSignup.length).toFixed(1)
      : 0;
    const medianMinutesToSignup = +median(minutesToSignup).toFixed(1);

    const hourCounts = new Array(24).fill(0) as number[];
    for (const e of events) {
      const h = new Date(e.created_at).getHours();
      if (h >= 0 && h < 24) hourCounts[h] += 1;
    }
    const peakHours = hourCounts.map((count, hour) => ({ hour: `${hour}:00`, count }));

    const budgetCounts = new Map<string, number>();
    const cuisineCounts = new Map<string, number>();
    const proteinCounts = new Map<string, number>();
    const dietCounts = new Map<string, number>();
    const goalCounts = new Map<string, number>();
    for (const l of leads) {
      const p = l.prefs;
      if (!p) continue;
      if (typeof p.budget === "string" && p.budget) {
        budgetCounts.set(p.budget, (budgetCounts.get(p.budget) ?? 0) + 1);
      }
      if (typeof p.diet === "string" && p.diet) {
        dietCounts.set(p.diet, (dietCounts.get(p.diet) ?? 0) + 1);
      }
      if (typeof p.goal === "string" && p.goal) {
        goalCounts.set(p.goal, (goalCounts.get(p.goal) ?? 0) + 1);
      }
      if (Array.isArray(p.cuisines)) {
        for (const c of p.cuisines) {
          if (typeof c === "string" && c) cuisineCounts.set(c, (cuisineCounts.get(c) ?? 0) + 1);
        }
      }
      if (Array.isArray(p.proteins)) {
        for (const pr of p.proteins) {
          if (typeof pr === "string" && pr) proteinCounts.set(pr, (proteinCounts.get(pr) ?? 0) + 1);
        }
      }
    }

    const leadsTotal = Math.max(stats.dbLeads, 1);
    const allLeadsTotal = Math.max(allLeads.length, 1);

    return {
      funnel,
      visitToSignupRate,
      signupToOnboardedRate,
      onboardedToMealRate,
      signupsPerDay,
      returningVisitors,
      duplicateAttempts,
      avgPagesBeforeSignup,
      medianMinutesToSignup,
      peakHours,
      signupsBySource: toCountRows(signupSourceCounts).slice(0, 8),
      prefsBudget: toCountRows(budgetCounts).slice(0, 6),
      prefsCuisines: toCountRows(cuisineCounts).slice(0, 8),
      prefsProteins: toCountRows(proteinCounts).slice(0, 6),
      prefsDiet: toCountRows(dietCounts).slice(0, 6),
      prefsGoal: toCountRows(goalCounts).slice(0, 6),
      calibratedPct: Math.round((stats.calibrated / leadsTotal) * 100),
      withPhonePct: Math.round((stats.withPhone / allLeadsTotal) * 100),
      withEmailPct: Math.round((stats.withEmail / allLeadsTotal) * 100),
      mealChosen: events.filter((e) => e.event_type === "meal_chosen").length,
      mealFeedback: events.filter((e) => e.event_type === "meal_feedback").length,
      mealSaved: events.filter((e) => e.event_type === "meal_saved").length,
    };
  }, [stats, events, leads, allLeads]);

  const filteredLeads = useMemo(() => {
    const q = leadQuery.trim().toLowerCase();
    if (!q) return allLeads;
    return allLeads.filter(
      (l) =>
        (l.phone || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        l.visitor_id.toLowerCase().includes(q),
    );
  }, [allLeads, leadQuery]);

  const filteredEvents = useMemo(() => {
    if (eventFilter === "all") return events;
    return events.filter((e) => e.event_type === eventFilter);
  }, [events, eventFilter]);

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <h1 className="text-hero text-[32px]">Picky Admin</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Leads, traffic, and product funnel. Password from{" "}
          <code>VITE_ADMIN_PASSWORD</code>.
        </p>
        <form onSubmit={onLogin} className="mt-6 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full rounded-2xl border border-black/10 bg-card px-4 py-3 text-[15px] outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-primary py-3 text-[14px] font-semibold text-primary-foreground"
          >
            Enter
          </button>
        </form>
        {error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.96_0.004_50)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Internal
            </p>
            <h1 className="text-hero text-[32px]">Picky Admin</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {stats.signupCount} leads · {stats.visitors} visitors · {stats.pageviews} pageviews
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-full border border-black/10 bg-card px-4 py-2 text-[12px] font-semibold disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
            {error}
          </div>
        )}

        {stats.dbLeads === 0 && allLeads.length === 0 && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-50 p-4 text-[13px] text-amber-950">
            <strong>No leads yet.</strong> Submit the waitlist form with phone + email to see
            data here, and make sure migration{" "}
            <code>20260718221500_fix_leads_upsert_and_backfill.sql</code> is applied in Lovable
            Cloud → Database → SQL.
          </div>
        )}
        {stats.dbLeads === 0 && allLeads.length > 0 && (
          <div className="mt-4 rounded-2xl border border-black/10 bg-card p-3 text-[12px] text-muted-foreground">
            Showing {allLeads.length} signup{allLeads.length === 1 ? "" : "s"} recovered from
            event logs — the <code>leads</code> table sync hasn&apos;t caught up yet.
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-1 rounded-full border border-black/10 bg-card p-1 w-fit">
          {(
            [
              ["overview", "Overview"],
              ["validate", "Validate"],
              ["leads", "Leads"],
              ["traffic", "Traffic"],
              ["activity", "Activity"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
                tab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Kpi label="Visitors" value={stats.visitors} />
              <Kpi label="Page views" value={stats.pageviews} />
              <Kpi label="Views / visit" value={stats.viewsPerVisit} />
              <Kpi label="Visit duration" value={formatDuration(stats.avgDwellSec)} />
              <Kpi label="Bounce rate" value={`${stats.bounceRate}%`} />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Leads (phone/email)" value={stats.signupCount} accent />
              <Kpi label="With phone" value={stats.withPhone} />
              <Kpi label="With email" value={stats.withEmail} />
              <Kpi label="Onboarded" value={stats.onboarded} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Visitors & signups · 14 days">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.visitorsChart}>
                      <defs>
                        <linearGradient id="vFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.62 0.245 27)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="oklch(0.62 0.245 27)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.005 60)" />
                      <XAxis dataKey="day" tickFormatter={(v) => String(v).slice(5)} tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Area type="monotone" dataKey="visitors" name="Visitors" stroke="oklch(0.62 0.245 27)" fill="url(#vFill)" strokeWidth={2} />
                      <Area type="monotone" dataKey="signups" name="Signups" stroke="oklch(0.45 0.08 250)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Idea validation funnel">
                <ul className="space-y-2.5">
                  {stats.funnel.map((step) => {
                    const max = Math.max(...stats.funnel.map((f) => f.count), 1);
                    return (
                      <li key={step.step}>
                        <div className="mb-1 flex justify-between text-[12.5px]">
                          <span className="font-medium">{step.step}</span>
                          <span className="tabular-nums text-muted-foreground">{step.count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(step.count / max) * 100}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-[12px] text-muted-foreground">
                  Conversion visit → signup:{" "}
                  <strong>
                    {stats.visitors
                      ? `${Math.round((stats.signupCount / stats.visitors) * 100)}%`
                      : "—"}
                  </strong>
                  {" · "}
                  signup → onboarded:{" "}
                  <strong>
                    {stats.signupCount
                      ? `${Math.round((stats.onboarded / stats.signupCount) * 100)}%`
                      : "—"}
                  </strong>
                </p>
              </Panel>
            </div>
          </div>
        )}

        {tab === "validate" && (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Kpi label="Visit → signup" value={`${validateStats.visitToSignupRate}%`} accent />
              <Kpi label="Signup → onboarded" value={`${validateStats.signupToOnboardedRate}%`} />
              <Kpi label="Onboarded → meal" value={`${validateStats.onboardedToMealRate}%`} />
              <Kpi label="Returning visitors" value={validateStats.returningVisitors} />
              <Kpi label="Duplicate attempts" value={validateStats.duplicateAttempts} />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Kpi label="Avg pages before signup" value={validateStats.avgPagesBeforeSignup} />
              <Kpi label="Median time to signup" value={`${validateStats.medianMinutesToSignup}m`} />
              <Kpi label="Calibrated leads" value={`${validateStats.calibratedPct}%`} />
              <Kpi label="With phone" value={`${validateStats.withPhonePct}%`} />
              <Kpi label="With email" value={`${validateStats.withEmailPct}%`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Conversion funnel">
                <ul className="space-y-2.5">
                  {validateStats.funnel.map((step) => (
                    <li key={step.step}>
                      <div className="mb-1 flex justify-between text-[12.5px]">
                        <span className="font-medium">{step.step}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {step.count} · {step.pctOfVisited}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${step.pctOfVisited}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Signups per day · 14 days">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={validateStats.signupsPerDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.005 60)" />
                      <XAxis dataKey="day" tickFormatter={(v) => String(v).slice(5)} tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="signups" name="Signups" fill="oklch(0.62 0.245 27)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Peak hours (local time)">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={validateStats.peakHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.005 60)" />
                      <XAxis dataKey="hour" interval={2} tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="count" name="Events" fill="oklch(0.55 0.14 250)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Signups by referrer source">
                <RankList
                  rows={validateStats.signupsBySource.map((s) => ({
                    label: s.label,
                    value: String(s.count),
                    weight: s.count,
                  }))}
                  empty="No attributed signups yet."
                  color="oklch(0.62 0.2 300)"
                />
              </Panel>
            </div>

            <Panel title="Customer preferences">
              <div className="grid gap-4 sm:grid-cols-2">
                <ChipList title="Budget" rows={validateStats.prefsBudget} />
                <ChipList title="Goal" rows={validateStats.prefsGoal} />
                <ChipList title="Diet" rows={validateStats.prefsDiet} />
                <ChipList title="Cuisines" rows={validateStats.prefsCuisines} />
                <ChipList title="Proteins" rows={validateStats.prefsProteins} />
              </div>
            </Panel>

            <Panel title="Engagement">
              <div className="grid grid-cols-3 gap-3">
                <Kpi label="Meal chosen" value={validateStats.mealChosen} />
                <Kpi label="Meal feedback" value={validateStats.mealFeedback} />
                <Kpi label="Meal saved" value={validateStats.mealSaved} />
              </div>
            </Panel>
          </div>
        )}

        {tab === "leads" && (
          <div className="mt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold">
                Leads · {filteredLeads.length}
              </h2>
              <input
                value={leadQuery}
                onChange={(e) => setLeadQuery(e.target.value)}
                placeholder="Search phone or email…"
                className="w-full max-w-xs rounded-xl border border-black/10 bg-card px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </div>
            <Panel>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-black/10 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3 font-semibold">Phone</th>
                      <th className="pb-2 pr-3 font-semibold">Email</th>
                      <th className="pb-2 pr-3 font-semibold">Calibrated</th>
                      <th className="pb-2 pr-3 font-semibold">Joined</th>
                      <th className="pb-2 font-semibold">Stored in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-muted-foreground">
                          No leads yet. Submit the waitlist form with phone + email, then refresh.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((l) => (
                        <tr key={l.visitor_id} className="border-b border-black/5">
                          <td className="py-2.5 pr-3 font-medium tabular-nums">
                            {l.phone || "—"}
                          </td>
                          <td className="py-2.5 pr-3">{l.email || "—"}</td>
                          <td className="py-2.5 pr-3">
                            {hasPrefs(l.prefs) ? (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                Yes
                              </span>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">
                            {new Date(l.created_at).toLocaleString()}
                          </td>
                          <td className="py-2.5 text-[11px] text-muted-foreground">
                            {l.source === "leads" ? "leads table" : "from events"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {tab === "traffic" && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Panel title="Source">
              <RankList
                rows={stats.sources.map((s) => ({
                  label: s.source,
                  value: String(s.count),
                  weight: s.count,
                }))}
                empty="No referrer data yet — new pageviews will capture it."
                color="oklch(0.55 0.14 250)"
              />
            </Panel>
            <Panel title="Page">
              <RankList
                rows={stats.pages.map((p) => ({
                  label: p.path,
                  value: `${p.views}${p.avgDwell ? ` · ${p.avgDwell}s` : ""}`,
                  weight: p.views,
                }))}
                empty="No pageviews yet."
                color="oklch(0.62 0.2 300)"
              />
            </Panel>
            <Panel title="Device">
              <RankList
                rows={stats.devices.map((d) => ({
                  label: d.device,
                  value: `${d.pct}%`,
                  weight: d.count,
                }))}
                empty="Device stats appear after leads sync with user agents."
                color="oklch(0.62 0.245 27)"
              />
            </Panel>
            <Panel title="Locale">
              <RankList
                rows={stats.locales.map((l) => ({
                  label: l.locale,
                  value: `${l.pct}%`,
                  weight: l.count,
                }))}
                empty="No locale data yet."
                color="oklch(0.5 0.12 200)"
              />
            </Panel>
            <Panel title="Events by type">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.eventTypes} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.005 60)" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="type" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="count" fill="oklch(0.62 0.245 27)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        )}

        {tab === "activity" && (
          <div className="mt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold">
                Recent events · {filteredEvents.length}
              </h2>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="rounded-xl border border-black/10 bg-card px-3 py-2 text-[13px]"
              >
                <option value="all">All types</option>
                {stats.eventTypes.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.type}
                  </option>
                ))}
              </select>
            </div>
            <Panel>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-black/10 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3 font-semibold">When</th>
                      <th className="pb-2 pr-3 font-semibold">Type</th>
                      <th className="pb-2 pr-3 font-semibold">Phone</th>
                      <th className="pb-2 font-semibold">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.slice(0, 150).map((ev) => (
                      <tr key={ev.id} className="border-b border-black/5 align-top">
                        <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">
                          {new Date(ev.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-3">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                            {ev.event_type}
                          </code>
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">{ev.phone || "—"}</td>
                        <td className="py-2.5 text-muted-foreground max-w-[320px] truncate">
                          {summarize(ev)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        accent ? "border-primary/25 bg-primary/5" : "border-black/10 bg-card"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-hero text-[28px] tabular-nums tracking-tight">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-card p-4 shadow-sm sm:p-5">
      {title && <h3 className="mb-3 text-[14px] font-semibold tracking-tight">{title}</h3>}
      {children}
    </section>
  );
}

function RankList({
  rows,
  empty,
  color,
}: {
  rows: { label: string; value: string; weight: number }[];
  empty: string;
  color: string;
}) {
  if (!rows.length) {
    return <p className="py-6 text-center text-[13px] text-muted-foreground">{empty}</p>;
  }
  const max = Math.max(...rows.map((r) => r.weight), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="relative overflow-hidden rounded-xl px-3 py-2">
          <div
            className="absolute inset-y-0 left-0 opacity-20"
            style={{ width: `${(r.weight / max) * 100}%`, background: color }}
          />
          <div className="relative flex items-center justify-between gap-3 text-[13px]">
            <span className="truncate font-medium">{r.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{r.value}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChipList({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">No data yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {rows.map((r) => (
            <span
              key={r.label}
              className="rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium"
            >
              {r.label} <span className="text-muted-foreground">· {r.count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function summarize(ev: EventRow): string {
  const p = ev.payload;
  if (ev.event_type === "waitlist_signup") {
    return [p.email, p.phone].filter(Boolean).join(" · ") || "signup";
  }
  if (ev.event_type === "pageview" || ev.event_type === "page_leave") {
    const path = typeof p.path === "string" ? p.path : "";
    const dur =
      typeof p.duration_ms === "number" ? `${Math.round(p.duration_ms / 1000)}s` : "";
    return [path, dur].filter(Boolean).join(" · ");
  }
  if (typeof p.email === "string") return p.email;
  if (typeof p.name === "string") return p.name;
  try {
    const s = JSON.stringify(p);
    return s.length > 90 ? `${s.slice(0, 90)}…` : s;
  } catch {
    return "—";
  }
}
