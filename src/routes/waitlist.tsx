import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Gift, Trophy, Send, Check } from "lucide-react";
import { TabBar, phoneShellClass } from "@/components/tab-bar";
import { LocaleSwitch } from "@/components/locale-switch";
import { useLocale } from "@/lib/i18n/locale";
import {
  ensureWaitlistPosition,
  readWaitlistPosition,
  syncLead,
  logEvent,
  readInvitedFriends,
  storeInvitedFriends,
  readWaitlistUnlocked,
  isValidSaudiMobile,
  formatSaudiMobileLocal,
  phoneDigitsKey,
  isPhoneAlreadyRegistered,
  allocateWaitlistRank,
} from "@/lib/tracking";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "Waitlist — Picky" },
      {
        name: "description",
        content:
          "Move up the Picky waitlist by inviting friends. Share your link and unlock priority access.",
      },
    ],
  }),
  component: Waitlist,
});

function Waitlist() {
  const { t, locale } = useLocale();
  const [link, setLink] = useState("https://trypicky.co/i/…");
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState("");
  const [invited, setInvited] = useState<string[]>(() => readInvitedFriends());
  const [position, setPosition] = useState<number | null>(() => readWaitlistPosition());
  const [loadingRank, setLoadingRank] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Restore invites immediately so ranking stays unlocked after leaving the page.
    const savedInvites = readInvitedFriends();
    if (savedInvites.length) setInvited(savedInvites);

    let cancelled = false;
    (async () => {
      setLoadingRank(true);
      const cached = readWaitlistPosition();
      if (cached != null && !cancelled) setPosition(cached);
      const fromServer = await ensureWaitlistPosition();
      if (!cancelled) {
        // Never wipe a known rank if the server briefly returns null.
        if (fromServer != null) setPosition(fromServer);
        setLoadingRank(false);
      }
    })();

    let refCode = localStorage.getItem("fylo:referralCode");
    if (!refCode) {
      const rand =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().replace(/-/g, "").slice(0, 6)
          : Math.random().toString(36).slice(2, 8);
      refCode = rand.toLowerCase();
      localStorage.setItem("fylo:referralCode", refCode);
    }
    setLink(`${window.location.origin}/?ref=${refCode}`);

    return () => {
      cancelled = true;
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const revealed = invited.length >= 3 || readWaitlistUnlocked();
  const remaining = Math.max(0, 3 - invited.length);

  const sendInvite = async () => {
    const trimmed = phone.trim();
    if (!trimmed || inviting) return;
    setInviteError(null);

    // 1) Format must be a Saudi mobile — clear format error only.
    if (!isValidSaudiMobile(trimmed)) {
      setInviteError(t("waitlist.error.invalidSaudi"));
      return;
    }

    const local = formatSaudiMobileLocal(trimmed);
    const key = phoneDigitsKey(trimmed);

    const ownRaw =
      typeof window !== "undefined"
        ? localStorage.getItem("userPhone") || ""
        : "";
    if (ownRaw && phoneDigitsKey(ownRaw) === key) {
      setInviteError(t("waitlist.error.ownPhone"));
      return;
    }

    // 2) Already on this client's invite list.
    if (invited.some((p) => phoneDigitsKey(p) === key)) {
      setInviteError(t("waitlist.error.alreadyInvited"));
      return;
    }

    setInviting(true);
    try {
      // 3) Already a waitlist lead in our database — never show as "invalid".
      const registered = await isPhoneAlreadyRegistered(trimmed);
      if (registered) {
        setInviteError(t("waitlist.error.alreadyRegistered"));
        return;
      }

      const next = [local, ...invited];
      setInvited(next);
      storeInvitedFriends(next);
      setPhone("");
      void logEvent("waitlist_friend_invited", {
        phone: local,
        invited_count: next.length,
      });

      if (next.length >= 3) {
        setLoadingRank(true);
        const pos = await allocateWaitlistRank();
        if (pos != null) {
          setPosition(pos);
          setInviteError(null);
        } else {
          const cached = readWaitlistPosition();
          if (cached != null) setPosition(cached);
          else setInviteError(t("waitlist.error.rankFailed"));
        }
        setLoadingRank(false);
      } else {
        void syncLead();
      }
    } finally {
      setInviting(false);
    }
  };

  const localeDigits = (n: number) =>
    locale === "ar" ? n.toLocaleString("ar-EG") : n.toLocaleString("en-US");

  const rankLabel = !revealed
    ? "•••"
    : position != null
      ? `#${localeDigits(position)}`
      : loadingRank
        ? "…"
        : "—";


  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10 overflow-x-hidden">
      <div className={phoneShellClass}>
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className="flex-1 overflow-y-auto px-6 pt-10 pb-8">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/lunches"
              className="inline-grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft border border-black/[0.04] text-foreground"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4 rtl-flip" strokeWidth={2.2} />
            </Link>
            <LocaleSwitch />
          </div>

          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-[11px] font-medium text-blush-foreground">
            <Gift className="h-3 w-3" strokeWidth={2.5} /> {t("waitlist.badge")}
          </div>
          <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight">
            {t("waitlist.hero.before")}{" "}
            <span className="italic text-primary">{t("waitlist.hero.italic")}</span>
          </h1>

          <div className="mt-6 rounded-3xl bg-card border border-black/[0.04] p-5 shadow-card">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <Trophy className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t("waitlist.position")}
                </div>
                <div className="font-display text-[28px] leading-none tracking-tight">
                  {rankLabel}
                </div>
              </div>
              <div className="ms-auto text-end">
                <div className="text-[11px] text-muted-foreground">{t("waitlist.friendsInvited")}</div>
                <div className="text-[18px] font-semibold text-primary">{invited.length}</div>
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, 28 + invited.length * 24)}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">{revealed ? t("waitlist.unlockedHint") : t("waitlist.unlockHint", { count: localeDigits(remaining) })}</div>
          </div>

          <section className="mt-6">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("waitlist.shareLink")}
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-card p-2 ps-4">
              <span className="flex-1 truncate text-[13px] font-medium text-foreground/90">
                {link}
              </span>
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-[12px] font-semibold text-primary-foreground transition active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" strokeWidth={3} /> {t("waitlist.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" strokeWidth={2.5} /> {t("waitlist.copy")}
                  </>
                )}
              </button>
            </div>
          </section>

          <section className="mt-6">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("waitlist.invitePhone")}
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-card p-2 ps-4 focus-within:border-primary transition">
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (inviteError) setInviteError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && void sendInvite()}
                placeholder={t("waitlist.invitePlaceholder")}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground text-start"
              />
              <button
                onClick={() => void sendInvite()}
                disabled={inviting || !phone.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2.5 text-[12px] font-semibold text-background transition active:scale-[0.98] disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5 rtl-flip" strokeWidth={2.5} /> {t("waitlist.invite")}
              </button>
            </div>
            {inviteError && (
              <p className="mt-2 text-[12px] font-medium text-primary" role="alert">
                {inviteError}
              </p>
            )}

            {invited.length > 0 && (
              <ul className="mt-4 space-y-2">
                {invited.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-[12px]"
                  >
                    <span className="truncate text-foreground/80">{e}</span>
                    <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                      {t("waitlist.pending")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>

        <TabBar active="waitlist" />
      </div>
    </div>
  );
}
