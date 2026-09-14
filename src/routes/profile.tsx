import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Settings,
  LogOut,
  Heart,
  Bell,
  Phone,
  MapPin,
  Wallet,
  Pencil,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LocaleSwitch } from "@/components/locale-switch";
import { TabBar, phoneMainClass, phonePageWrapClass, phoneShellClass } from "@/components/tab-bar";
import { useSavedMeals } from "@/hooks/use-saved-meals";
import { useLocale } from "@/lib/i18n/locale";
import { logEvent, syncLead } from "@/lib/tracking";
import {
  formatLocationLabel,
  profileInitial,
  readUserProfile,
  saveUserProfile,
  PROFILE_BUDGET_MIN,
  PROFILE_BUDGET_MAX,
  type UserProfile,
} from "@/lib/user-profile";

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
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftBudgetMax, setDraftBudgetMax] = useState(80);

  const refresh = () => setProfile(readUserProfile());

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("storage", onUpdate);
    window.addEventListener("fylo:prefsUpdated", onUpdate);
    return () => {
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("fylo:prefsUpdated", onUpdate);
    };
  }, []);

  const startEdit = () => {
    setDraftName(profile.name || "");
    setDraftPhone(profile.phone || "");
    setDraftBudgetMax(profile.budgetMax ?? 80);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = () => {
    const name = draftName.trim();
    const phoneDigits = draftPhone.replace(/\D/g, "");
    if (name.length < 2 || phoneDigits.length < 9) return;
    const max = Math.max(PROFILE_BUDGET_MIN, Math.min(PROFILE_BUDGET_MAX, draftBudgetMax));
    const next = saveUserProfile({
      name,
      phone: draftPhone.trim(),
      budgetMax: max,
    });
    setProfile(next);
    setEditing(false);
    syncLead();
    logEvent("profile_updated", { name, budgetMin: PROFILE_BUDGET_MIN, budgetMax: max });
  };

  const phoneValid = draftPhone.replace(/\D/g, "").length >= 9;
  const nameValid = draftName.trim().length >= 2;
  const canSave = nameValid && phoneValid;

  const displayName = profile.name || t("common.brand");
  const initial = profileInitial(editing ? draftName : profile.name);
  const locationLabel =
    formatLocationLabel(profile.city, profile.district) ?? t("profile.missing");
  const budgetLabel =
    profile.budgetMax != null
      ? t("profile.budgetMax", { max: String(profile.budgetMax) })
      : t("profile.missing");

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

  const clampMax = (v: number) =>
    Math.max(Math.min(PROFILE_BUDGET_MAX, v), PROFILE_BUDGET_MIN);

  return (
    <div className={phonePageWrapClass}>
      <div className={phoneShellClass}>
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className={`${phoneMainClass} px-6 pt-10 pb-8`}>
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/lunches"
              className="inline-grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft border border-black/[0.04] text-foreground"
            >
              <ArrowLeft className="h-4 w-4 rtl-flip" strokeWidth={2.2} />
            </Link>
            <div className="flex items-center gap-2">
              <LocaleSwitch />
              {!editing ? (
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-card px-3.5 py-2 text-[12px] font-semibold text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("profile.edit")}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-full px-3.5 py-2 text-[12px] font-medium text-muted-foreground"
                  >
                    {t("profile.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={!canSave}
                    className="rounded-full bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground disabled:opacity-40"
                  >
                    {t("profile.save")}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-primary text-primary-foreground font-display text-[22px] leading-none shrink-0">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              {editing ? (
                <label className="block">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("profile.nameLabel")}
                  </span>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/[0.08] bg-card px-3 py-2 font-display text-[22px] leading-tight outline-none focus:border-primary"
                    autoComplete="name"
                  />
                </label>
              ) : (
                <div className="font-display text-[26px] leading-none tracking-tight truncate">
                  {displayName}
                </div>
              )}
              <div className="mt-1 text-[12px] text-muted-foreground">{t("profile.subtitle")}</div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-card border border-black/[0.04] shadow-card overflow-hidden">
            {editing ? (
              <div className="p-5 space-y-5">
                <label className="block">
                  <span className="flex items-center gap-2 text-[14px] font-medium">
                    <Phone className="h-4 w-4 text-primary" />
                    {t("profile.phone")}
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-black/[0.08] bg-background px-3 py-3 text-[15px] font-medium outline-none focus:border-primary"
                    placeholder={t("onboarding.phone.placeholder")}
                  />
                </label>

                <div>
                  <span className="flex items-center gap-2 text-[14px] font-medium">
                    <Wallet className="h-4 w-4 text-primary" />
                    {t("profile.budget")}
                  </span>
                  <p className="mt-3 text-[22px] font-display font-semibold tabular-nums text-primary">
                    {draftBudgetMax} {t("common.sar")}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{t("onboarding.budget.floorHint")}</p>
                  <input
                    type="range"
                    min={PROFILE_BUDGET_MIN}
                    max={PROFILE_BUDGET_MAX}
                    step={5}
                    value={draftBudgetMax}
                    onChange={(e) => setDraftBudgetMax(clampMax(Number(e.target.value)))}
                    className="mt-3 w-full accent-primary"
                    aria-label={t("onboarding.budget.maxLabel")}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1 border-t border-black/[0.06] text-[13px]">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {t("profile.location")}
                  </span>
                  <span className="font-medium text-foreground truncate max-w-[50%] text-end">
                    {locationLabel}
                  </span>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                <div className="flex w-full items-center justify-between px-5 py-4">
                  <span className="flex items-center gap-3 text-[14px] font-medium">
                    <User className="h-4 w-4 text-primary" strokeWidth={2.2} />
                    {t("profile.nameLabel")}
                  </span>
                  <span className="text-[12px] text-muted-foreground text-end max-w-[55%] truncate">
                    {profile.name || t("profile.missing")}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between px-5 py-4">
                  <span className="flex items-center gap-3 text-[14px] font-medium">
                    <Phone className="h-4 w-4 text-primary" strokeWidth={2.2} />
                    {t("profile.phone")}
                  </span>
                  <span className="text-[12px] text-muted-foreground text-end max-w-[55%] truncate">
                    {profile.phone || t("profile.missing")}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between px-5 py-4">
                  <span className="flex items-center gap-3 text-[14px] font-medium">
                    <MapPin className="h-4 w-4 text-primary" strokeWidth={2.2} />
                    {t("profile.location")}
                  </span>
                  <span className="text-[12px] text-muted-foreground text-end max-w-[55%] truncate">
                    {locationLabel}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between px-5 py-4">
                  <span className="flex items-center gap-3 text-[14px] font-medium">
                    <Wallet className="h-4 w-4 text-primary" strokeWidth={2.2} />
                    {t("profile.budget")}
                  </span>
                  <span className="text-[12px] text-muted-foreground text-end max-w-[55%] truncate">
                    {budgetLabel}
                  </span>
                </div>
              </div>
            )}
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
