import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Settings, LogOut, Heart, Bell, Phone, MapPin, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { TabBar, phoneMainClass, phonePageWrapClass, phoneShellClass } from "@/components/tab-bar";
import { useSavedMeals } from "@/hooks/use-saved-meals";
import { useLocale } from "@/lib/i18n/locale";
import { profileInitial, readUserProfile, type UserProfile } from "@/lib/user-profile";

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
  const { t } = useLocale();
  const { count } = useSavedMeals();
  const [profile, setProfile] = useState<UserProfile>(() => readUserProfile());

  useEffect(() => {
    const refresh = () => setProfile(readUserProfile());
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const displayName = profile.name || t("common.brand");
  const initial = profileInitial(profile.name);
  const budgetLabel =
    profile.budgetMin != null && profile.budgetMax != null
      ? t("profile.budgetRange", {
          min: String(profile.budgetMin),
          max: String(profile.budgetMax),
        })
      : t("profile.missing");

  const accountRows = [
    {
      Icon: Phone,
      label: t("profile.phone"),
      value: profile.phone || t("profile.missing"),
    },
    {
      Icon: MapPin,
      label: t("profile.city"),
      value: profile.city || t("profile.missing"),
    },
    {
      Icon: Wallet,
      label: t("profile.budget"),
      value: budgetLabel,
    },
  ];

  const menuRows: Array<{
    Icon: typeof Heart;
    label: string;
    value?: string;
    to?: "/saved";
  }> = [
    { Icon: Heart, label: t("profile.savedMeals"), value: String(count), to: "/saved" },
    { Icon: Bell, label: t("profile.notifications"), value: t("profile.notificationsOn") },
    { Icon: Settings, label: t("profile.preferences"), value: t("profile.preferencesEdit") },
    { Icon: LogOut, label: t("profile.signOut") },
  ];

  return (
    <div className={phonePageWrapClass}>
      <div className={phoneShellClass}>
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className={`${phoneMainClass} px-6 pt-10 pb-8`}>
          <Link
            to="/lunches"
            className="inline-grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft border border-black/[0.04] text-foreground"
          >
            <ArrowLeft className="h-4 w-4 rtl-flip" strokeWidth={2.2} />
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-primary text-primary-foreground font-display text-[22px] leading-none">
              {initial}
            </span>
            <div className="min-w-0">
              <div className="font-display text-[26px] leading-none tracking-tight truncate">
                {displayName}
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">{t("profile.subtitle")}</div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-card border border-black/[0.04] divide-y divide-border shadow-card">
            {accountRows.map(({ Icon, label, value }) => (
              <div key={label} className="flex w-full items-center justify-between px-5 py-4">
                <span className="flex items-center gap-3 text-[14px] font-medium">
                  <Icon className="h-4 w-4 text-primary" strokeWidth={2.2} />
                  {label}
                </span>
                <span className="text-[12px] text-muted-foreground text-end max-w-[55%] truncate">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-3xl bg-card border border-black/[0.04] divide-y divide-border shadow-card">
            {menuRows.map(({ Icon, label, value, to }) => {
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
                "flex w-full items-center justify-between px-5 py-4 text-start hover:bg-secondary/50 transition first:rounded-t-3xl last:rounded-b-3xl";
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
