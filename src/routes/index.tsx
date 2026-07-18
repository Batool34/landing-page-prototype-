import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Instagram, Linkedin } from "lucide-react";
import { useEffect, useState } from "react";
import welcomeHero from "@/assets/welcome-hero.jpg";
import { ensureVisitorId, getVisitorId, trackEvent, trackPageview } from "@/lib/analytics";
import { syncLead, logEvent } from "@/lib/tracking";
import { LandingChrome } from "@/components/landing-chrome";

function TikTokIcon({ className }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.8a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z" />
    </svg>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Picky — We take care of you, so you can take care of life." },
      {
        name: "description",
        content:
          "Picky picks your perfect lunch every day and delivers it — no scrolling, no decision fatigue.",
      },
      { property: "og:title", content: "Picky — We take care of you, so you can take care of life." },
      {
        property: "og:description",
        content:
          "Picky picks your perfect lunch every day and delivers it — no scrolling, no decision fatigue.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Picky" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Picky — We take care of you, so you can take care of life." },
      {
        name: "twitter:description",
        content:
          "Picky picks your perfect lunch every day and delivers it — no scrolling, no decision fatigue.",
      },
    ],
  }),
  component: WelcomeLanding,
});

function WelcomeLanding() {
  useEffect(() => {
    ensureVisitorId();
    trackPageview();
  }, []);

  return (
    <LandingChrome active="home" heroImage={welcomeHero}>
      <Hero />
    </LandingChrome>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  const rawDigits = phone.replace(/\D/g, "");
  const phoneValid =
    /^\+?[\d\s-]{8,20}$/.test(phone.trim()) && rawDigits.length >= 8 && rawDigits.length <= 15;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = phoneValid && emailValid;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    const digits = rawDigits;
    const emailTrimmed = email.trim().toLowerCase();

    try {
      const body = new URLSearchParams({
        "form-name": "waitlist",
        phone: digits,
        email: emailTrimmed,
      });
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
    } catch {
      /* ignore */
    }

    trackEvent("waitlist_submit", { phone: digits, email: emailTrimmed });

    try {
      ensureVisitorId();
      const formatted = phone.startsWith("+") ? phone : `+${digits}`;
      localStorage.setItem("userPhone", formatted);
      localStorage.setItem("userEmail", emailTrimmed);
      localStorage.setItem("fylo:welcomed", "1");
      const sync = await syncLead();
      await logEvent("waitlist_signup", {
        phone: formatted,
        email: emailTrimmed,
        source: "welcome_landing",
        lead_synced: sync.ok,
        lead_error: sync.ok ? null : sync.message,
      });
      if (!sync.ok) {
        console.error("[waitlist] lead sync failed:", sync.message);
      }
    } catch {
      /* ignore */
    }

    setSubmitting(false);
    setJoined(true);
  };

  const onFastTrack = () => {
    const digits = rawDigits;
    trackEvent("fast_track_click", { phone: digits, email: email.trim() });
    navigate({
      to: "/onboarding",
      search: {
        phone: digits,
        visitor_id: getVisitorId(),
        utm_source: "landing",
        utm_campaign: "waitlist",
      } as never,
    });
  };

  return (
    <section className="relative mx-auto flex min-h-[calc(100dvh-64px)] w-full max-w-md flex-col px-4 sm:px-5 pt-6 sm:pt-8 pb-20 sm:pb-24">
      <div className="flex justify-start">
        <span className="glass-pill inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[10px] sm:text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/85">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
              style={{ backgroundColor: "oklch(0.82 0.15 85)" }}
            />
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "oklch(0.82 0.15 85)" }}
            />
          </span>
          Now taking waitlist
        </span>
      </div>

      <h1 className="text-hero mt-5 sm:mt-6 text-[34px] leading-[1.08] text-white sm:text-[48px] sm:leading-[1.05]">
        We take care of{" "}
        <span className="italic" style={{ color: "oklch(0.82 0.15 85)" }}>
          you,
        </span>{" "}
        so you can take care of life.
      </h1>

      <p className="mt-4 sm:mt-5 text-[14px] sm:text-[15px] leading-relaxed text-white/75">
        Picky picks your perfect lunch every day and delivers it to your desk —
        no scrolling, no group chats, no decision fatigue.
      </p>

      <div className="mt-7">
        {joined ? (
          <div
            className="glass-panel p-5"
            style={{ borderColor: "oklch(0.82 0.15 85 / 0.35)" }}
          >
            <div className="text-hero text-[26px] text-white">You're in! 🚀</div>
            <p className="mt-2 text-[14px] leading-relaxed text-white/75">
              Welcome to Picky. We've saved your spot. Watch your inbox for early access.
            </p>
            <p className="mt-4 text-[13.5px] leading-relaxed text-white/60">
              Want priority access? Calibrate your taste profile now to lock in
              your first week of lunches.
            </p>
            <button
              type="button"
              onClick={onFastTrack}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground shadow-[0_14px_40px_-12px_oklch(0.62_0.24_27/0.7)] active:scale-[0.99]"
            >
              Fast-Track My Access
              <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
            </button>
          </div>
        ) : (
          <form
            name="waitlist"
            data-netlify="true"
            autoComplete="on"
            onSubmit={onSubmit}
            className="glass-pill flex flex-col gap-3 rounded-3xl p-3"
          >
            <input type="hidden" name="form-name" value="waitlist" />

            <div className="flex flex-col gap-1">
              <label
                htmlFor="waitlist-phone"
                className="px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55"
              >
                Phone
              </label>
              <input
                id="waitlist-phone"
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                autoCorrect="off"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={(e) => {
                  // Safari may autofill without firing onChange — sync DOM → React
                  if (e.currentTarget.value && e.currentTarget.value !== phone) {
                    setPhone(e.currentTarget.value);
                  }
                }}
                placeholder="+966 5X XXX XXXX"
                className="min-w-0 w-full rounded-full bg-white/[0.06] px-5 py-3 text-[16px] text-white placeholder:text-white/40 outline-none ring-1 ring-white/10"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="waitlist-email"
                className="px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55"
              >
                Email
              </label>
              <input
                id="waitlist-email"
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => {
                  if (e.currentTarget.value && e.currentTarget.value !== email) {
                    setEmail(e.currentTarget.value);
                  }
                }}
                placeholder="name@email.com"
                className="min-w-0 w-full rounded-full bg-white/[0.06] px-5 py-3 text-[16px] text-white placeholder:text-white/40 outline-none ring-1 ring-white/10"
              />
            </div>

            <button
              type="submit"
              disabled={!valid || submitting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground shadow-[0_14px_40px_-12px_oklch(0.62_0.24_27/0.7)] transition active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Joining…" : "Join Waitlist"}
              <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
            </button>
          </form>
        )}

        <div className="mt-5 grid grid-cols-3 gap-1.5 sm:gap-2 px-0 sm:px-1">
          {[
            { k: "1", label: "Daily", sub: "handpicked lunch" },
            { k: "79+", label: "Restaurants", sub: "around you" },
            { k: "0", label: "Scrolling", sub: "required" },
          ].map((s) => (
            <div
              key={s.label}
              className="glass-panel rounded-2xl px-2 sm:px-3 py-3 text-center"
            >
              <div className="text-hero text-[16px] sm:text-[18px] leading-none text-white">
                {s.k}
              </div>
              <div className="mt-1.5 text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/70">
                {s.label}
              </div>
              <div className="mt-0.5 text-[9px] sm:text-[10px] text-white/45 leading-snug">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <SocialRow />
    </section>
  );
}

function SocialRow() {
  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <a
        href="https://www.instagram.com/try.picky/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="glass-pill grid h-10 w-10 place-items-center rounded-full text-white"
      >
        <Instagram className="h-4 w-4" strokeWidth={2} />
      </a>
      <a
        href="https://www.tiktok.com/@try.picky"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="TikTok"
        className="glass-pill grid h-10 w-10 place-items-center rounded-full text-white"
      >
        <TikTokIcon className="h-4 w-4" />
      </a>
      <a
        href="https://www.linkedin.com/company/trypicky/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
        className="glass-pill grid h-10 w-10 place-items-center rounded-full text-white"
      >
        <Linkedin className="h-4 w-4" strokeWidth={2} />
      </a>
    </div>
  );
}
