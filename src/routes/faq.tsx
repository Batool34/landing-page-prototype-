import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import welcomeHero from "@/assets/welcome-hero.jpg";
import { LandingChrome } from "@/components/landing-chrome";
import { trackPageview } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/locale";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Picky" },
      {
        name: "description",
        content:
          "Answers to the most common questions about Picky — how it works, delivery, pricing, and more.",
      },
      { property: "og:title", content: "FAQ — Picky" },
      {
        property: "og:description",
        content:
          "Answers to the most common questions about Picky — how it works, delivery, pricing, and more.",
      },
      { property: "og:type", content: "article" },
    ],
  }),
  component: FaqPage,
});

const FAQ_KEYS = [
  { q: "faq.q1", a: "faq.a1" },
  { q: "faq.q2", a: "faq.a2" },
  { q: "faq.q3", a: "faq.a3" },
  { q: "faq.q4", a: "faq.a4" },
  { q: "faq.q5", a: "faq.a5" },
  { q: "faq.q6", a: "faq.a6" },
] as const;

function FaqPage() {
  const { t } = useLocale();
  useEffect(() => {
    trackPageview();
  }, []);

  const [open, setOpen] = useState<number | null>(0);

  return (
    <LandingChrome active="faq" heroImage={welcomeHero}>
      <section className="mx-auto w-full max-w-md px-4 sm:px-5 pt-6 sm:pt-8 pb-16">
        <span className="glass-pill inline-flex items-center rounded-full px-3.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/85">
          {t("faq.badge")}
        </span>

        <h1 className="text-hero mt-5 sm:mt-6 text-[32px] leading-[1.08] text-white sm:text-[48px] sm:leading-[1.05]">
          {t("faq.hero.before")}{" "}
          <span className="italic" style={{ color: "oklch(0.82 0.15 85)" }}>
            {t("faq.hero.italic")}
          </span>
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-white/70">{t("faq.intro")}</p>

        <div className="mt-8 space-y-2">
          {FAQ_KEYS.map((item, i) => {
            const isOpen = open === i;
            const q = t(item.q);
            return (
              <div key={item.q} className="glass-panel overflow-hidden rounded-2xl">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start"
                  aria-expanded={isOpen}
                >
                  <span className="text-[14px] font-semibold text-white">{q}</span>
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
                    {t(item.a)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="glass-panel mt-8 rounded-3xl p-6 text-center">
          <div className="text-hero text-[20px] leading-tight text-white">
            {t("faq.stillCurious")}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/65">
            {t("faq.reachOut")}{" "}
            <a href="mailto:hi@trypicky.co" className="text-white underline underline-offset-4">
              {t("faq.reachOutEmail")}
            </a>
            .
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-[13.5px] font-semibold text-primary-foreground shadow-[0_14px_40px_-12px_oklch(0.62_0.24_27/0.7)]"
          >
            {t("faq.cta")}
            <ArrowRight className="h-4 w-4 rtl-flip" strokeWidth={2.6} />
          </Link>
        </div>
      </section>
    </LandingChrome>
  );
}
