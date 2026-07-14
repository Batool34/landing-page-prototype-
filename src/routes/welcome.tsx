import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Globe, Instagram, Linkedin, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import heroBowls from "@/assets/welcome-hero.jpg";
import logoAsset from "@/assets/fylo-logo.asset.json";
import { getVisitorId, trackEvent, trackPageview } from "@/lib/analytics";
import { syncLead, logEvent } from "@/lib/tracking";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Fylo — We take care of you, so you can take care of life." },
      {
        name: "description",
        content:
          "Fylo learns your habits to recommend and compare your perfect daily lunches from Jahez, HungerStation, and Keeta.",
      },
      { property: "og:title", content: "Fylo — We take care of you, so you can take care of life." },
      {
        property: "og:description",
        content:
          "Fylo learns your habits to recommend and compare your perfect daily lunches from Jahez, HungerStation, and Keeta.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Fylo" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Fylo — We take care of you, so you can take care of life." },
      {
        name: "twitter:description",
        content:
          "Fylo learns your habits to recommend and compare your perfect daily lunches from Jahez, HungerStation, and Keeta.",
      },
    ],
  }),
  component: WelcomeLanding,
});

const LANG_KEY = "fylo-lang";
type Lang = "EN" | "AR";

function WelcomeLanding() {
  useEffect(() => {
    trackPageview();
    // Apply persisted lang on mount
    try {
      const saved = (localStorage.getItem(LANG_KEY) as Lang) || "EN";
      document.documentElement.lang = saved === "AR" ? "ar" : "en";
      document.documentElement.dir = saved === "AR" ? "rtl" : "ltr";
    } catch {
      /* ignore */
    }
    return () => {
      // Restore LTR when leaving so app screens are unaffected
      document.documentElement.dir = "ltr";
    };
  }, []);

  return (
    <div className="fylo-dark relative min-h-screen overflow-x-hidden font-sans">
      {/* Background hero image */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <img
          src={heroBowls}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
          style={{ transform: "scale(1.05)" }}
        />
        {/* vertical gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-background/15 to-background/85" />
        {/* vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 20%, oklch(0.14 0.02 20 / 0.55) 80%)",
          }}
        />
        {/* orbs */}
        <div
          className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-[0.15]"
          style={{ background: "oklch(0.62 0.24 27)", filter: "blur(140px)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full opacity-[0.15]"
          style={{ background: "oklch(0.82 0.15 85)", filter: "blur(140px)" }}
        />
      </div>

      <TopNav />
      <Hero />
      <Footer />
    </div>
  );
}

function TopNav() {
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("EN");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = (localStorage.getItem(LANG_KEY) as Lang) || "EN";
      setLang(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [langOpen]);

  const pick = (l: Lang) => {
    setLang(l);
    setLangOpen(false);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l === "AR" ? "ar" : "en";
    document.documentElement.dir = l === "AR" ? "rtl" : "ltr";
    trackEvent("lang_switch", { lang: l });
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <header
      className="fixed inset-x-0 top-0 z-40"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={scrollTop}
          className="flex min-w-0 shrink-0 items-center gap-2"
          aria-label="Fylo home"
        >
          <img
            src={logoAsset.url}
            alt="Fylo"
            className="h-11 w-11 shrink-0"
            style={{ filter: "drop-shadow(0 4px 18px oklch(0.62 0.24 27 / 0.55))" }}
          />
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <div ref={ref} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="glass-pill inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-white"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
            >
              <Globe className="h-4 w-4" strokeWidth={2} />
              {lang}
            </button>
            {langOpen && (
              <div
                role="listbox"
                className="glass-panel absolute right-0 top-12 w-28 overflow-hidden p-1 text-[13px]"
              >
                {(["EN", "AR"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    role="option"
                    aria-selected={lang === l}
                    onClick={() => pick(l)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                      lang === l ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/5"
                    }`}
                  >
                    <span>{l === "EN" ? "English" : "العربية"}</span>
                    <span className="text-white/40">{l}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <a
            href="https://app.tryfylo.co"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("open_app_click", {})}
            className="glass-pill inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold text-white"
          >
            Open App
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
          </a>
        </div>
      </div>
    </header>
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

    // Netlify Forms style POST (silent)
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

    // Persist locally + backend so a drop-off is still a captured lead
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
      },
    });
  };

  return (
    <main
      className="relative mx-auto flex min-h-screen max-w-md flex-col px-5"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 88px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)",
      }}
    >
      {/* Badge */}
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

      {/* Headline */}
      <h1 className="text-hero mt-6 text-[44px] text-white sm:text-[52px]">
        We take care of{" "}
        <span className="italic" style={{ color: "oklch(0.82 0.15 85)" }}>
          you,
        </span>{" "}
        so you can take care of life.
      </h1>

      <p className="mt-5 text-[15px] leading-relaxed text-white/75">
        Supporting every version of you — healthy, unhealthy, and everything in between. Fylo learns
        your habits to recommend and compare your perfect daily lunches from your favorite local
        apps.
      </p>

      {/* Waitlist form or success */}
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
              Want priority access? Calibrate your personal AI meal filter right now to secure your
              lunch recommendations on day one.
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

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-[11.5px] text-white/50">
          <span>Compares across</span>
          <span className="font-semibold text-white/85">Jahez</span>
          <span className="text-white/25">·</span>
          <span className="font-semibold text-white/85">HungerStation</span>
          <span className="text-white/25">·</span>
          <span className="font-semibold text-white/85">Keeta</span>
        </div>
      </div>

      <div className="flex-1" />
    </main>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/60 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-5 py-3 text-[11px] text-white/55 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <span>© {year} Fylo</span>
          <span className="text-white/25">·</span>
          <a href="#" className="hover:text-white/80">
            Privacy
          </a>
          <span className="text-white/25">·</span>
          <a href="#" className="hover:text-white/80">
            Terms
          </a>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://instagram.com/tryfylo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="glass-pill grid h-9 w-9 place-items-center rounded-full text-white"
          >
            <Instagram className="h-4 w-4" strokeWidth={2} />
          </a>
          <a
            href="https://linkedin.com/company/tryfylo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="glass-pill grid h-9 w-9 place-items-center rounded-full text-white"
          >
            <Linkedin className="h-4 w-4" strokeWidth={2} />
          </a>
        </div>
      </div>
    </footer>
  );
}

// Silence unused-import warnings for icons kept for future use.
void Menu;
void X;
