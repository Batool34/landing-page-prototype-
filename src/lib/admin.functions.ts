import { createServerFn } from "@tanstack/react-start";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

type AdminData = {
  leads: Array<{ [k: string]: Json }>;
  events: Array<{ [k: string]: Json }>;
};

export const fetchAdminData = createServerFn({ method: "POST" })
  .inputValidator((data: unknown): { password: string } => {
    if (
      !data ||
      typeof data !== "object" ||
      typeof (data as { password?: unknown }).password !== "string"
    ) {
      throw new Error("password required");
    }
    return { password: (data as { password: string }).password };
  })
  .handler(async ({ data }): Promise<AdminData> => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new Error("Admin not configured");
    if (data.password !== expected) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [leadsRes, eventsRes] = await Promise.all([
      supabaseAdmin
        .from("leads")
        .select(
          "visitor_id, phone, email, waitlist_position, user_agent, prefs, created_at, updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("events")
        .select("id, visitor_id, phone, event_type, payload, created_at")
        .order("created_at", { ascending: false })
        .limit(3000),
    ]);

    if (leadsRes.error) throw new Error(leadsRes.error.message);
    if (eventsRes.error) throw new Error(eventsRes.error.message);

    return {
      leads: (leadsRes.data ?? []) as Array<Record<string, unknown>>,
      events: (eventsRes.data ?? []) as Array<Record<string, unknown>>,
    };
  });
