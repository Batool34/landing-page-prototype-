import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Instagram, Linkedin } from "lucide-react";
import { useEffect, useState } from "react";
import heroBowls from "@/assets/hero-bowls.jpg.asset.json";
import { getVisitorId, trackEvent, trackPageview } from "@/lib/analytics";
import { syncLead, logEvent } from "@/lib/tracking";
import { LandingChrome } from "@/components/landing-chrome";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Fylo — We take care of you, so you can take care of life." },
      {
        name: "description",
        content:
          "Fylo picks your perfect lunch every day and delivers it — no scrolling, no decision fatigue.",
      },
      { property: "og:title", content: "Fylo — We take care of you, so you can take care of life." },
      {
        property: "og:description",
        content:
          "Fylo picks your perfect lunch every day and delivers it — no scrolling, no decision fatigue.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Fylo" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Fylo — We take care of you, so you can take care of life." },
      {
        name: "twitter:description",
        content:
          "Fylo picks your perfect lunch every day and delivers it — no scrolling, no decision fatigue.",
      },
    ],
  }),
  component: WelcomeLanding,
});

function WelcomeLanding() {
  useEffect(() => {
    trackPageview();
  }, []);

  return (
    <LandingChrome active="home" heroImage={heroBowls.url}>
      <Hero />
    </LandingChrome>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  const rawDigits = phone.replace(/\D/g, "");
  const valid =
    /^\+?[\d\s-]{8,20}$/.test(phone.trim()) && rawDigits.length >= 8 && rawDigits.length <= 15;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    const digits = rawDigits;

    try {
      const body = new URLSearchParams({ "form-name": "waitlist", phone: digits });
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
    } catch {
      /* ignore */
    }

    trackEvent("waitlist_submit", { phone: digits });

    try {
      const formatted = phone.startsWith("+") ? phone : `+${digits}`;
      localStorage.setItem("userPhone", formatted);
      localStorage.setItem("fylo:welcomed", "1");
      await syncLead();
      await logEvent("waitlist_phone_captured", {
        phone: formatted,
        source: "welcome_landing",
      });
    } catch {
      /* ignore */
    }

    setSubmitting(false);
    setJoined(true);
  };

  const onFastTrack = () => {
    const digits = rawDigits;
    trackEvent("fast_track_click", { phone: digits });
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
    <section className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col px-5 pt-8 pb-24">
      <div className="flex justify-start">
        <span className="glass-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/85">
          <span className="relative flex h-1.5 w-1.5">
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

      <h1 className="text-hero mt-6 text-[42px] leading-[1.05] text-white sm:text-[52px]">
        We take care of{" "}
        <span className="italic" style={{ color: "oklch(0.82 0.15 85)" }}>
          you,
        </span>{" "}
        so you can take care of life.
      </h1>

      <p className="mt-5 text-[15px] leading-relaxed text-white/75">
        Fylo picks your perfect lunch every day and delivers it to your desk —
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
              Welcome to Fylo. We've saved your spot. Watch your inbox for early access.
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
            onSubmit={onSubmit}
            className="glass-pill flex flex-col gap-2 rounded-3xl p-2 sm:flex-row sm:items-center sm:rounded-full"
          >
            <input type="hidden" name="form-name" value="waitlist" />
            <input
              type="tel"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+966 5X XXX XXXX"
              className="min-w-0 flex-1 rounded-full bg-transparent px-5 py-3 text-[15px] text-white placeholder:text-white/40 outline-none"
            />
            <button
              type="submit"
              disabled={!valid || submitting}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground shadow-[0_14px_40px_-12px_oklch(0.62_0.24_27/0.7)] transition active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Joining…" : "Join Waitlist"}
              <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
            </button>
          </form>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 px-1">
          {[
            { k: "1", label: "Daily", sub: "handpicked lunch" },
            { k: "79+", label: "Restaurants", sub: "around you" },
            { k: "0", label: "Scrolling", sub: "required" },
          ].map((s) => (
            <div
              key={s.label}
              className="glass-panel rounded-2xl px-3 py-3 text-center"
            >
              <div className="text-hero text-[18px] leading-none text-white">
                {s.k}
              </div>
              <div className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/70">
                {s.label}
              </div>
              <div className="mt-0.5 text-[10px] text-white/45">{s.sub}</div>
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
        href="https://instagram.com/tryfylo"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="glass-pill grid h-10 w-10 place-items-center rounded-full text-white"
      >
        <Instagram className="h-4 w-4" strokeWidth={2} />
      </a>
      <a
        href="https://linkedin.com/company/tryfylo"
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
