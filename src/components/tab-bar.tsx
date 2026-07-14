import { Link } from "@tanstack/react-router";
import { UtensilsCrossed, Gift, History, User } from "lucide-react";

type Tab = {
  id: string;
  to: string;
  label: string;
  Icon: typeof UtensilsCrossed;
  badge?: boolean;
};
const tabs: Tab[] = [
  { id: "lunches", to: "/", label: "Lunches", Icon: UtensilsCrossed },
  { id: "waitlist", to: "/waitlist", label: "Waitlist", Icon: Gift, badge: true },
  { id: "history", to: "/history", label: "History", Icon: History },
  { id: "profile", to: "/profile", label: "Profile", Icon: User },
];


export function TabBar({ active }: { active: string }) {
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-20 bg-background/85 backdrop-blur-xl border-t border-black/5">
      <div className="grid grid-cols-5 px-2 pt-2 pb-3">
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
