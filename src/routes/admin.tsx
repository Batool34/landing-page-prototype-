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

function AdminDashboard() {
  const expected = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;
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
      setError("Set VITE_ADMIN_PASSWORD in your env (Lovable / .env), then rebuild.");
      return;
    }
    if (password !== expected) {
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
          View waitlist signups and activity. Password is set via VITE_ADMIN_PASSWORD.
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
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Waitlist signups
        </h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-black/5 bg-card">
          <table className="w-full min-w-[640px] text-left text-[12px]">
            <thead className="border-b border-black/5 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Phone</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Visitor</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.visitor_id} className="border-b border-black/[0.04]">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{l.phone ?? "—"}</td>
                  <td className="px-3 py-2">{l.email ?? "—"}</td>
                  <td className="px-3 py-2">{l.waitlist_position ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
                    {l.visitor_id.slice(0, 8)}…
                  </td>
                </tr>
              ))}
              {!leads.length && !loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    No leads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent activity
        </h2>
        <ul className="mt-3 space-y-2">
          {events.slice(0, 80).map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-black/5 bg-card px-3 py-2 text-[12px]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  {e.event_type}
                </span>
                <span className="text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()}
                </span>
                {e.phone && <span>{e.phone}</span>}
              </div>
              <pre className="mt-1 overflow-x-auto text-[10px] text-muted-foreground">
                {JSON.stringify(e.payload)}
              </pre>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 pb-16">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Time on page (from page_leave)
        </h2>
        <div className="mt-3 space-y-3">
          {[...pageTimes.entries()].slice(0, 40).map(([vid, rows]) => (
            <div key={vid} className="rounded-xl border border-black/5 bg-card p-3 text-[12px]">
              <div className="font-mono text-[10px] text-muted-foreground">{vid}</div>
              <ul className="mt-2 space-y-1">
                {rows.map((r, i) => (
                  <li key={`${r.at}-${i}`} className="flex justify-between gap-3">
                    <span>{r.path}</span>
                    <span className="text-muted-foreground">
                      {(r.duration_ms / 1000).toFixed(1)}s
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!pageTimes.size && (
            <p className="text-[13px] text-muted-foreground">
              No dwell-time events yet. Browse the site, then refresh.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
