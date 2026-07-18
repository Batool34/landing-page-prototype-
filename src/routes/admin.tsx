import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Picky" }],
  }),
  component: AdminDashboard,
});

type Lead = {
  visitor_id: string;
  phone: string | null;
  email: string | null;
  waitlist_position: number | null;
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

const SESSION_KEY = "picky:admin_ok";

function getExpectedPassword(): string {
  const raw = import.meta.env.VITE_ADMIN_PASSWORD;
  return typeof raw === "string" ? raw.trim() : "";
}

function AdminDashboard() {
  const expected = getExpectedPassword();
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
  }, []);

  const pageTimes = useMemo(() => {
    const map = new Map<string, { path: string; duration_ms: number; at: string }[]>();
    for (const e of events) {
      if (e.event_type !== "page_leave") continue;
      const path = String(e.payload?.path ?? "/");
      const duration_ms = Number(e.payload?.duration_ms ?? 0);
      const list = map.get(e.visitor_id) ?? [];
      list.push({ path, duration_ms, at: e.created_at });
      map.set(e.visitor_id, list);
    }
    return map;
  }, [events]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, eventsRes] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("events").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      if (leadsRes.error) throw leadsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      setLeads((leadsRes.data ?? []) as Lead[]);
      setEvents((eventsRes.data ?? []) as EventRow[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load data. Run the email+select migration in Supabase, then refresh.",
      );
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
        "Password is not loaded in this preview yet. In Lovable .env set VITE_ADMIN_PASSWORD=\"MySecret123\", save, then refresh the preview.",
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

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <h1 className="text-hero text-[32px]">Picky Admin</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          View waitlist signups and activity. Password comes from{" "}
          <code>VITE_ADMIN_PASSWORD</code> in <code>.env</code>.
        </p>
        <form onSubmit={onLogin} className="mt-6 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoComplete="current-password"
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
        {!expected && (
          <p className="mt-3 text-[12px] text-muted-foreground">
            Tip: after editing <code>.env</code>, hard-refresh the preview (
            <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>).
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-hero text-[28px]">Picky Admin</h1>
          <p className="text-[12px] text-muted-foreground">
            {leads.length} leads · {events.length} recent events
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-black/10 px-4 py-2 text-[12px] font-semibold"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
          {error}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-[16px] font-semibold">Waitlist / leads</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-black/10 bg-card">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-black/10 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Position</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No leads yet.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.visitor_id} className="border-b border-black/5">
                    <td className="px-4 py-3 tabular-nums">{l.phone || "—"}</td>
                    <td className="px-4 py-3">{l.email || "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{l.waitlist_position ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[16px] font-semibold">Recent activity</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-black/10 bg-card">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-black/10 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No events yet.
                  </td>
                </tr>
              ) : (
                events.slice(0, 100).map((ev) => {
                  const dwell = pageTimes.get(ev.visitor_id);
                  const detail =
                    ev.event_type === "page_leave"
                      ? `${String(ev.payload?.path ?? "/")} · ${Math.round(Number(ev.payload?.duration_ms ?? 0) / 1000)}s`
                      : ev.event_type === "click"
                        ? String(ev.payload?.label ?? ev.payload?.path ?? "—")
                        : JSON.stringify(ev.payload).slice(0, 80);
                  return (
                    <tr key={ev.id} className="border-b border-black/5 align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(ev.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                          {ev.event_type}
                        </code>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{ev.phone || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {detail}
                        {dwell && dwell.length > 0 && ev.event_type === "session_start" ? (
                          <span className="block text-[11px] opacity-70">
                            {dwell.length} page visits tracked
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
