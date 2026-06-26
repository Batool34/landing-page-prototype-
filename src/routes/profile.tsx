import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, User, Settings, LogOut, Heart, Bell } from "lucide-react";
import { TabBar } from "@/components/tab-bar";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Fylo" },
      { name: "description", content: "Your Fylo profile and preferences." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const rows = [
    { Icon: Heart, label: "Saved meals", value: "12" },
    { Icon: Bell, label: "Notifications", value: "On" },
    { Icon: Settings, label: "Preferences", value: "Edit" },
    { Icon: LogOut, label: "Sign out" },
  ];
  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10">
      <div className="mx-auto w-full max-w-[420px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative">
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className="px-6 pt-10 pb-40">
          <Link
            to="/"
            className="inline-grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft border border-black/[0.04] text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-primary text-primary-foreground">
              <User className="h-7 w-7" strokeWidth={2} />
            </span>
            <div>
              <div className="font-display text-[26px] leading-none tracking-tight">
                Layla
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                Maintain · Riyadh · Apple Health
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-card border border-black/[0.04] divide-y divide-border shadow-card">
            {rows.map(({ Icon, label, value }) => (
              <button
                key={label}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition first:rounded-t-3xl last:rounded-b-3xl"
              >
                <span className="flex items-center gap-3 text-[14px] font-medium">
                  <Icon className="h-4 w-4 text-primary" strokeWidth={2.2} />
                  {label}
                </span>
                {value && (
                  <span className="text-[12px] text-muted-foreground">{value}</span>
                )}
              </button>
            ))}
          </div>

          <Link
            to="/onboarding"
            className="mt-6 block text-center text-[12px] font-semibold text-primary"
          >
            Re-run calibration →
          </Link>
        </main>

        <TabBar active="profile" />
      </div>
    </div>
  );
}
