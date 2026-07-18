import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import heroBowls from "@/assets/hero-bowls.jpg.asset.json";
import { LandingChrome } from "@/components/landing-chrome";
import { trackPageview } from "@/lib/analytics";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Fylo" },
      {
        name: "description",
        content:
          "Answers to the most common questions about Fylo — how it works, delivery, pricing, and more.",
      },
      { property: "og:title", content: "FAQ — Fylo" },
      {
        property: "og:description",
        content:
          "Answers to the most common questions about Fylo — how it works, delivery, pricing, and more.",
      },
      { property: "og:type", content: "article" },
    ],
  }),
  component: FaqPage,
});

const FAQS = [
  {
    q: "What is Fylo?",
    a: "Fylo is your daily lunch decision-maker. Each workday, we pick one perfect lunch for you based on your taste and deliver it to your desk.",
  },
  {
    q: "How does Fylo choose my lunch?",
    a: "You complete a quick taste calibration once. Fylo then rotates the top-matching meals from our partner kitchens, learning from your feedback over time.",
  },
  {
    q: "Where does Fylo deliver?",
    a: "We're starting with select business districts in Riyadh. Join the waitlist and we'll notify you the moment your neighborhood goes live.",
  },
  {
    q: "Can I change or skip my lunch?",
    a: "Yes. You can swap for another top match, edit your delivery address, or skip the day entirely — all from your dashboard.",
  },
  {
    q: "What if I have allergies or diet restrictions?",
    a: "You tell us during onboarding. Fylo filters every recommendation against your allergies and dietary preferences before it ever reaches you.",
  },
  {
    q: "How much does it cost?",
    a: "Waitlist members get founding pricing at launch. Full pricing details will be shared as we open access.",
  },
];

function FaqPage() {
  useEffect(() => {
    trackPageview();
  }, []);

  const [open, setOpen] = useState<number | null>(0);

  return (
    <LandingChrome active="faq" heroImage={heroBowls.url}>
      <section className="mx-auto max-w-md px-5 pt-8 pb-16">
        <span className="glass-pill inline-flex items-center rounded-full px-3.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/85">
          FAQ
        </span>

        <h1 className="text-hero mt-6 text-[38px] leading-[1.05] text-white sm:text-[48px]">
          Good{" "}
          <span className="italic" style={{ color: "oklch(0.82 0.15 85)" }}>
            questions.
          </span>
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-white/70">
          Everything you might want to know before joining the waitlist.
        </p>

        <div className="mt-8 space-y-2">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="glass-panel overflow-hidden rounded-2xl"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-[14px] font-semibold text-white">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={
                      "h-4 w-4 shrink-0 text-white/60 transition-transform " +
                      (isOpen ? "rotate-180" : "")
                    }
                    strokeWidth={2}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-[13.5px] leading-relaxed text-white/70">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="glass-panel mt-8 rounded-3xl p-6 text-center">
          <div className="text-hero text-[20px] leading-tight text-white">
            Still curious?
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/65">
            Reach out at{" "}
            <a
              href="mailto:hi@tryfylo.co"
              className="text-white underline underline-offset-4"
            >
              hi@tryfylo.co
            </a>
            .
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
