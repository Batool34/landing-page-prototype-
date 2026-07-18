import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Settings, LogOut, Heart, Bell } from "lucide-react";
import { TabBar, phoneShellClass } from "@/components/tab-bar";
import { useSavedMeals } from "@/hooks/use-saved-meals";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Picky" },
      { name: "description", content: "Your Picky profile and preferences." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { count } = useSavedMeals();
  const rows: Array<{
    Icon: typeof Heart;
    label: string;
    value?: string;
    to?: "/saved";
  }> = [
    { Icon: Heart, label: "Saved meals", value: String(count), to: "/saved" },
    { Icon: Bell, label: "Notifications", value: "On" },
    { Icon: Settings, label: "Preferences", value: "Edit" },
    { Icon: LogOut, label: "Sign out" },
  ];
  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10 overflow-x-hidden">
      <div className={phoneShellClass}>
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className="flex-1 px-6 pt-10 pb-8">
          <Link
            to="/lunches"
            className="inline-grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft border border-black/[0.04] text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-primary text-primary-foreground font-display text-[28px] leading-none">
              P
            </span>
            <div>
              <div className="font-display text-[26px] leading-none tracking-tight">
                Picky
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                Maintain · Riyadh · Apple Health
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-card border border-black/[0.04] divide-y divide-border shadow-card">
            {rows.map(({ Icon, label, value, to }) => {
              const content = (
                <>
                  <span className="flex items-center gap-3 text-[14px] font-medium">
                    <Icon className="h-4 w-4 text-primary" strokeWidth={2.2} />
                    {label}
                  </span>
                  {value && (
                    <span className="text-[12px] text-muted-foreground">{value}</span>
                  )}
                </>
              );
              const cls =
                "flex w-full items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition first:rounded-t-3xl last:rounded-b-3xl";
              return to ? (
                <Link key={label} to={to} className={cls}>
                  {content}
                </Link>
              ) : (
                <button key={label} type="button" className={cls}>
                  {content}
                </button>
              );
            })}
          </div>
        </main>

        <TabBar active="profile" />
      </div>
    </div>
  );
}
