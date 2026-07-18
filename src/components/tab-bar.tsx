import { Link } from "@tanstack/react-router";
import { UtensilsCrossed, Wallet, Gift, History, User } from "lucide-react";

type Tab = {
  id: string;
  to: string;
  label: string;
  Icon: typeof UtensilsCrossed;
  badge?: boolean;
};
const tabs: Tab[] = [
  { id: "lunches", to: "/lunches", label: "Lunches", Icon: UtensilsCrossed },
  { id: "savings", to: "/savings", label: "Savings", Icon: Wallet },
  { id: "waitlist", to: "/waitlist", label: "Waitlist", Icon: Gift, badge: true },
  { id: "history", to: "/history", label: "History", Icon: History },
  { id: "profile", to: "/profile", label: "Profile", Icon: User },
];

export function TabBar({ active }: { active: string }) {
  return (
    <nav className="mt-auto shrink-0 z-20 bg-background/90 backdrop-blur-xl border-t border-black/5 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 px-1.5 pt-2 pb-3">
        {tabs.map((t) => {
          const isActive = t.id === active;
          const Icon = t.Icon;
          return (
            <Link
              key={t.id}
              to={t.to as "/"}
              className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 transition ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="relative">
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {t.badge && (
                  <span className="absolute -top-1 -right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </span>
              <span className="text-[10px] font-medium">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Full-height phone frame so short pages still pin TabBar to the bottom. */
export const phoneShellClass =
  "mx-auto flex min-h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-background relative md:min-h-0 md:h-[844px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)]";
