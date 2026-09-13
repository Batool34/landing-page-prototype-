import { Link } from "@tanstack/react-router";
import { UtensilsCrossed, Gift, History, User } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale";

type Tab = {
  id: string;
  to: string;
  labelKey: string;
  Icon: typeof UtensilsCrossed;
  badge?: boolean;
};

const tabs: Tab[] = [
  { id: "lunches", to: "/lunches", labelKey: "tabs.lunches", Icon: UtensilsCrossed },
  { id: "waitlist", to: "/waitlist", labelKey: "tabs.waitlist", Icon: Gift, badge: true },
  { id: "history", to: "/history", labelKey: "tabs.history", Icon: History },
  { id: "profile", to: "/profile", labelKey: "tabs.profile", Icon: User },
];

export function TabBar({ active }: { active: string }) {
  const { t } = useLocale();
  return (
    <nav
      className="mt-auto shrink-0 z-30 bg-background/95 backdrop-blur-xl border-t border-black/5 pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-4 px-1.5 pt-2 pb-3">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          const Icon = tab.Icon;
          return (
            <Link
              key={tab.id}
              to={tab.to as "/"}
              className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 transition ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="relative">
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {tab.badge && (
                  <span className="absolute -top-1 -end-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </span>
              <span className="text-[10px] font-medium">{t(tab.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Phone frame: fixed viewport height so TabBar stays pinned while main scrolls. */
export const phoneShellClass =
  "mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-background relative md:h-[844px] md:max-h-[844px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)]";

/** Scrollable main column above the tab bar. */
export const phoneMainClass = "min-h-0 flex-1 overflow-y-auto overscroll-y-contain";

/** Outer page wrapper for tabbed screens (prevents body scroll on mobile). */
export const phonePageWrapClass =
  "h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[oklch(0.94_0.005_30)] py-0 md:h-auto md:max-h-none md:min-h-[100dvh] md:py-10 md:overflow-x-hidden";
