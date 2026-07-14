import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, ScanSearch, ShoppingBag } from "lucide-react";
import { useState } from "react";
import heroImg from "@/assets/welcome-hero.jpg";
import { LandingShell } from "@/components/landing-shell";
import { syncLead, logEvent } from "@/lib/tracking";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Fylo — We take care of you, so you can take care of life." },
      {
        name: "description",
        content:
          "Fylo learns your habits to recommend and compare your perfect daily lunches across Jahez, HungerStation, and Keeta.",
      },
      { property: "og:title", content: "Fylo — Healthy, Made Intelligent." },
      {
        property: "og:description",
        content:
          "AI-curated daily lunches. One tap to Jahez, HungerStation, or Keeta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WelcomeLanding,
});

function ensureVisitorId() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("fylo:visitorId")) {
    const vid =
      (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
    localStorage.setItem("fylo:visitorId", vid);
  }
}

function WelcomeLanding() {
  return (
    <LandingShell active="home">
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <FinalCta />
    </LandingShell>
  );
}

function Hero() {
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const digits = phone.replace(/\D/g, "");
  const valid = digits.length >= 9;

  const join = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    if (typeof window !== "undefined") {
      ensureVisitorId();
      const formatted = phone.startsWith("+") ? phone : `+966${digits}`;
      localStorage.setItem("userPhone", formatted);
      localStorage.setItem("fylo:welcomed", "1");
      try {
        await syncLead();
        await logEvent("waitlist_phone_captured", {
          phone: formatted,
          source: "welcome_landing",
        });
      } catch {
        /* ignore */
      }
    }
    setSubmitting(false);
    setDone(true);
  };

  return (
    <section className="relative pt-10 md:pt-16 pb-16 md:pb-24">
      <div className="grid gap-10 md:grid-cols-[1.05fr_1fr] md:gap-12 items-center">
        {/* Copy */}
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/75 ring-1 ring-white/10">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Now taking waitlist
          </span>

          <h1 className="mt-6 font-display text-[44px] leading-[1.02] tracking-tight text-white sm:text-[56px] md:text-[64px]">
            We take care of{" "}
            <span className="italic text-primary">you,</span>
            <br className="hidden sm:block" />
            so you can take care
            <br className="hidden sm:block" /> of life.
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/65 md:text-[16px]">
            Supporting every version of you—healthy, unhealthy, and everything
            in between. Fylo learns your habits to recommend and compare your
            perfect daily lunches from your favorite local apps.
          </p>

          {/* Waitlist form */}
          <div className="mt-8 max-w-lg">
            {done ? (
              <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 px-5 py-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-white">
                    You're on the list.
                  </div>
                  <div className="text-[12.5px] text-white/60 mt-0.5">
                    Let's set up your lunch preferences.
                  </div>
                </div>
                <Link
                  to="/onboarding"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground"
                >
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-white/[0.05] p-1.5 ring-1 ring-white/10 focus-within:ring-white/25 transition">
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 5X XXX XXXX"
                  className="flex-1 bg-transparent px-4 py-2.5 text-[14px] text-white placeholder:text-white/35 outline-none"
                />
                <button
                  type="button"
                  onClick={join}
                  disabled={!valid || submitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.7)] disabled:opacity-50 active:scale-[0.98] transition"
                >
                  Join Waitlist
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
                </button>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-white/45">
              <span>Compares across</span>
              <span className="font-semibold text-white/80">Jahez</span>
              <span className="text-white/25">·</span>
              <span className="font-semibold text-white/80">HungerStation</span>
              <span className="text-white/25">·</span>
              <span className="font-semibold text-white/80">Keeta</span>
            </div>
          </div>
        </div>

        {/* Hero image */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-[2rem] ring-1 ring-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
            <img
              src={heroImg}
              alt="A vibrant Fylo lunch bowl"
              className="w-full h-[380px] sm:h-[460px] md:h-[560px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
              <div className="rounded-2xl bg-black/45 backdrop-blur px-3.5 py-2 ring-1 ring-white/10">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/60">
                  Today's match
                </div>
                <div className="text-[13px] font-semibold text-white">
                  Grilled Chicken & Quinoa Bowl
                </div>
              </div>
              <div className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-semibold shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.7)]">
                Best on Keeta
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-white/[0.06] py-6">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12px] uppercase tracking-[0.22em] text-white/40">
        <span>Riyadh · Jeddah · DMM</span>
        <span className="hidden sm:block h-1 w-1 rounded-full bg-white/25" />
        <span>Halal-first</span>
        <span className="hidden sm:block h-1 w-1 rounded-full bg-white/25" />
        <span>No paid placements</span>
        <span className="hidden sm:block h-1 w-1 rounded-full bg-white/25" />
        <span>Prices in SAR</span>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      Icon: Sparkles,
      title: "Tell us about you",
      body: "A 60-second onboarding on your goals, tastes, and budget. Fylo builds your palate profile.",
    },
    {
      Icon: ScanSearch,
      title: "We compare everything",
      body: "Our engine scans local menus across Jahez, HungerStation, and Keeta to find your daily match.",
    },
    {
      Icon: ShoppingBag,
      title: "One-tap to order",
      body: "Pick your delivery time, and Fylo deep-links you to the cheapest, fastest option—instantly.",
    },
  ];
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">
          How it works
        </div>
        <h2 className="mt-3 font-display text-[34px] leading-tight tracking-tight text-white md:text-[44px]">
          Three taps between you and a{" "}
          <span className="italic text-primary">better lunch.</span>
        </h2>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map(({ Icon, title, body }, i) => (
          <div
            key={title}
            className="rounded-3xl bg-white/[0.03] ring-1 ring-white/[0.08] p-6 hover:bg-white/[0.05] transition"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                Step {i + 1}
              </div>
            </div>
            <div className="mt-5 font-display text-[22px] leading-tight text-white">
              {title}
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="pb-8">
      <div className="relative overflow-hidden rounded-[2rem] ring-1 ring-white/10 bg-gradient-to-br from-[oklch(0.24_0.06_25)] via-[oklch(0.18_0.03_25)] to-[oklch(0.14_0.02_25)] px-6 py-12 md:px-14 md:py-16 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative">
          <h3 className="font-display text-[32px] leading-tight tracking-tight text-white md:text-[42px]">
            Stop deciding.{" "}
            <span className="italic text-primary">Start eating.</span>
          </h3>
          <p className="mx-auto mt-4 max-w-lg text-[14px] text-white/65">
            Join early users in Riyadh getting their perfect lunch chosen for
            them every day.
          </p>
          <Link
            to="/onboarding"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[14px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.7)]"
          >
            Get my first match
            <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
          </Link>
        </div>
      </div>
    </section>
  );
}
