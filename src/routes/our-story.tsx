import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, MapPin, Heart } from "lucide-react";
import { useEffect } from "react";
import heroBowls from "@/assets/hero-bowls.jpg.asset.json";
import { LandingChrome } from "@/components/landing-chrome";
import { trackPageview } from "@/lib/analytics";

export const Route = createFileRoute("/our-story")({
  head: () => ({
    meta: [
      { title: "Our Story — Fylo" },
      {
        name: "description",
        content:
          "Fylo was born from a simple daily question: what should I eat for lunch? Here's why we're rebuilding the answer.",
      },
      { property: "og:title", content: "Our Story — Fylo" },
      {
        property: "og:description",
        content:
          "Fylo was born from a simple daily question: what should I eat for lunch? Here's why we're rebuilding the answer.",
      },
      { property: "og:type", content: "article" },
    ],
  }),
  component: OurStoryPage,
});

const CHAPTERS = [
  {
    icon: Sparkles,
    title: "The lunch problem",
    body: "Every workday, millions of people lose 20 minutes scrolling three delivery apps just to give up and re-order the same thing. We got tired of that ritual.",
  },
  {
    icon: Heart,
    title: "Made for how you actually eat",
    body: "Fylo doesn't shame you into salads. It learns your real taste — the healthy days, the comfort days, the 'just something warm' days — and picks accordingly.",
  },
  {
    icon: MapPin,
    title: "Built in Riyadh, for Riyadh",
    body: "We started with the restaurants we love around us. Every meal on Fylo is hand-selected from local kitchens we'd send to a friend.",
  },
];

function OurStoryPage() {
  useEffect(() => {
    trackPageview();
  }, []);

  return (
    <LandingChrome active="story" heroImage={heroBowls.url}>
      <section className="mx-auto max-w-md px-5 pt-8 pb-16">
        <span className="glass-pill inline-flex items-center rounded-full px-3.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/85">
          Our Story
        </span>

        <h1 className="text-hero mt-6 text-[38px] leading-[1.05] text-white sm:text-[48px]">
          One perfect lunch,{" "}
          <span className="italic" style={{ color: "oklch(0.82 0.15 85)" }}>
            decided for you.
          </span>
        </h1>

        <p className="mt-5 text-[15px] leading-relaxed text-white/75">
          Fylo started as a group chat between friends who kept asking each
          other the same question at 12:47 PM every day: what are we eating?
          We built the answer.
        </p>

        <div className="mt-8 space-y-3">
          {CHAPTERS.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="glass-panel rounded-2xl p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="grid h-9 w-9 place-items-center rounded-full"
                  style={{ backgroundColor: "oklch(0.62 0.24 27 / 0.18)" }}
                >
                  <Icon
                    className="h-4 w-4"
                    strokeWidth={2.2}
                    style={{ color: "oklch(0.82 0.15 85)" }}
                  />
                </div>
                <h2 className="text-hero text-[18px] text-white">{title}</h2>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">
                {body}
              </p>
            </article>
          ))}
        </div>

        <div className="glass-panel mt-8 rounded-3xl p-6 text-center">
          <div className="text-hero text-[22px] leading-tight text-white">
            Join the first 500.
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/65">
            We're taking a small waitlist to make sure every lunch lands warm
            and on time.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-[13.5px] font-semibold text-primary-foreground shadow-[0_14px_40px_-12px_oklch(0.62_0.24_27/0.7)]"
          >
            Join the waitlist
            <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
          </Link>
        </div>
      </section>
    </LandingChrome>
  );
}
