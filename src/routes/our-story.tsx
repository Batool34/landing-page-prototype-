import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, CircleDollarSign, Heart } from "lucide-react";
import { useEffect } from "react";
import welcomeHero from "@/assets/welcome-hero.jpg";
import { LandingChrome } from "@/components/landing-chrome";
import { trackPageview } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/locale";

export const Route = createFileRoute("/our-story")({
  head: () => ({
    meta: [
      { title: "Our Story — Picky" },
      {
        name: "description",
        content:
          "Picky plans your week of meals and compares Jahez, HungerStation, and Keeta — so you only decide once, then tap to order.",
      },
      { property: "og:title", content: "Our Story — Picky" },
      {
        property: "og:description",
        content:
          "Picky plans your week of meals and compares Jahez, HungerStation, and Keeta — so you only decide once, then tap to order.",
      },
      { property: "og:type", content: "article" },
    ],
  }),
  component: OurStoryPage,
});

const CHAPTERS = [
  { icon: Sparkles, titleKey: "story.chapter1.title", bodyKey: "story.chapter1.body" },
  { icon: Heart, titleKey: "story.chapter2.title", bodyKey: "story.chapter2.body" },
  { icon: CircleDollarSign, titleKey: "story.chapter3.title", bodyKey: "story.chapter3.body" },
] as const;

function OurStoryPage() {
  const { t } = useLocale();
  useEffect(() => {
    trackPageview();
  }, []);

  return (
    <LandingChrome active="story" heroImage={welcomeHero}>
      <section className="mx-auto w-full max-w-md px-4 sm:px-5 pt-6 sm:pt-8 pb-16">
        <span className="glass-pill inline-flex items-center rounded-full px-3.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/85">
          {t("story.badge")}
        </span>

        <h1 className="text-hero mt-5 sm:mt-6 text-[28px] leading-[1.15] text-white sm:text-[40px] sm:leading-[1.1]">
          {t("story.hero.before")}
        </h1>
        <p
          className="mt-2.5 text-[14px] leading-relaxed sm:text-[15px]"
          style={{ color: "oklch(0.82 0.15 85)" }}
        >
          {t("story.hero.italic")}
        </p>

        <p className="mt-5 text-[15px] font-bold leading-relaxed text-white/85">
          {t("story.intro")}
        </p>

        <div className="mt-8 space-y-3">
          {CHAPTERS.map(({ icon: Icon, titleKey, bodyKey }) => (
            <article key={titleKey} className="glass-panel rounded-2xl p-5">
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
                <h2 className="text-hero text-[18px] text-white">{t(titleKey)}</h2>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">{t(bodyKey)}</p>
            </article>
          ))}
        </div>

        <div className="glass-panel mt-8 rounded-3xl p-6 text-center">
          <div className="text-hero text-[22px] leading-tight text-white">{t("story.cta.title")}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/65">{t("story.cta.body")}</p>
          <Link
            to="/"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-[13.5px] font-semibold text-primary-foreground shadow-[0_14px_40px_-12px_oklch(0.62_0.24_27/0.7)]"
          >
            {t("story.cta.button")}
            <ArrowRight className="h-4 w-4 rtl-flip" strokeWidth={2.6} />
          </Link>
        </div>
      </section>
    </LandingChrome>
  );
}
