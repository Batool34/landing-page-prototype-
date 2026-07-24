import { Link } from "@tanstack/react-router";
import { Globe, Instagram, Linkedin, Mail } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import pickyLogo from "@/assets/picky-logo.png";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/locale";
import type { Locale } from "@/lib/i18n/types";

function TikTokIcon({ className }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.8a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z" />
    </svg>
  );
}

type NavKey = "home" | "story" | "faq";

const NAV: { key: NavKey; labelKey: string; shortKey: string; to: string }[] = [
  { key: "home", labelKey: "nav.home", shortKey: "nav.home", to: "/" },
  { key: "story", labelKey: "nav.story", shortKey: "nav.storyShort", to: "/our-story" },
  { key: "faq", labelKey: "nav.faq", shortKey: "nav.faq", to: "/faq" },
];

export function LandingChrome({
  active,
  heroImage,
  children,
}: {
  active: NavKey;
  heroImage?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="picky-dark relative min-h-screen overflow-x-hidden font-sans"
      style={heroImage ? { backgroundColor: "transparent" } : undefined}
    >
      <BackgroundLayer heroImage={heroImage} />
      <div className="relative z-10">
        <TopNav active={active} />
        <div style={{ paddingTop: "calc(env(safe-area-inset-top) + 72px)" }}>{children}</div>
        <Footer />
      </div>
    </div>
  );
}

function BackgroundLayer({ heroImage }: { heroImage?: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {heroImage ? (
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
          decoding="async"
          fetchPriority="high"
        />
      ) : (
        <div className="h-full w-full bg-[oklch(0.14_0.015_25)]" />
      )}
      {/* Light scrim — keeps text readable without hiding the food */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/60" />
    </div>
  );
}

function TopNav({ active }: { active: NavKey }) {
  const { t, locale, setLocale } = useLocale();
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!langOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [langOpen]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const pickLocale = (next: Locale) => {
    setLocale(next);
    setLangOpen(false);
  };

  const code = locale === "ar" ? t("chrome.lang.arCode") : t("chrome.lang.enCode");

  return (
    <header className="fixed inset-x-0 top-0 z-40" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto w-full max-w-md px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="glass-pill flex min-h-11 items-center justify-between gap-1 sm:gap-2 rounded-full px-1.5 sm:px-2 py-1">
          <button
            type="button"
            onClick={scrollTop}
            className="flex min-w-0 shrink-0 items-center gap-1.5 ps-0.5 sm:ps-1"
            aria-label={t("nav.homeAria")}
          >
            <img
              src={pickyLogo}
              alt={t("common.brand")}
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain"
              decoding="async"
              fetchPriority="high"
            />
          </button>

          <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5">
            {NAV.map((item) => {
              const isActive = active === item.key;
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => trackEvent("nav_click", { to: item.to })}
                  className={
                    "rounded-full px-2 sm:px-3 py-1.5 text-[11px] sm:text-[12px] font-medium transition whitespace-nowrap " +
                    (isActive ? "bg-white/[0.12] text-white ring-1 ring-white/15" : "text-white/65 hover:text-white")
                  }
                >
                  <span className="sm:hidden">{t(item.shortKey)}</span>
                  <span className="hidden sm:inline">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          <div ref={ref} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full bg-white/[0.05] px-2 sm:px-2.5 text-[12px] font-medium text-white ring-1 ring-white/10"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
            >
              <Globe className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="hidden xs:inline sm:inline">{code}</span>
            </button>
            {langOpen && (
              <div
                role="listbox"
                className="glass-panel absolute end-0 top-11 w-40 overflow-hidden p-1 text-[13px]"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={locale === "en"}
                  onClick={() => pickLocale("en")}
                  className={
                    "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-start text-white " +
                    (locale === "en" ? "bg-white/10" : "hover:bg-white/5")
                  }
                >
                  <span>English</span>
                  <span className="text-white/40">EN</span>
                </button>
                <button
                  type="button"
                  role="option"
                  aria-selected={locale === "ar"}
                  onClick={() => pickLocale("ar")}
                  className={
                    "mt-0.5 flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-start text-white " +
                    (locale === "ar" ? "bg-white/10" : "hover:bg-white/5")
                  }
                >
                  <span>العربية</span>
                  <span className="text-white/40">AR</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

const SOCIALS = [
  { labelKey: "chrome.footer.instagram", href: "https://www.instagram.com/try.picky/", Icon: Instagram },
  { labelKey: "chrome.footer.tiktok", href: "https://www.tiktok.com/@try.picky", Icon: TikTokIcon },
  { labelKey: "chrome.footer.linkedin", href: "https://www.linkedin.com/company/trypicky/", Icon: Linkedin },
  { labelKey: "chrome.footer.email", href: "mailto:hi@trypicky.co", Icon: Mail },
];

function Footer() {
  const { t } = useLocale();
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-16 border-t border-white/10 bg-black/35 backdrop-blur-md">
      <div className="mx-auto max-w-md px-5 py-8">
        <div className="flex items-center gap-2">
          <img
            src={pickyLogo}
            alt={t("common.brand")}
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            loading="lazy"
            decoding="async"
          />
          <span className="text-hero text-[18px] text-white">{t("common.brand")}</span>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-white/60">
          {t("chrome.footer.tagline")}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-6 text-[13px]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">
              {t("chrome.footer.company")}
            </div>
            <ul className="mt-3 space-y-2">
              {NAV.map((item) => (
                <li key={item.key}>
                  <Link to={item.to} className="text-white/75 hover:text-white">
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">
              {t("chrome.footer.follow")}
            </div>
            <ul className="mt-3 space-y-2">
              {SOCIALS.map(({ labelKey, href, Icon }) => (
                <li key={labelKey}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 text-white/75 hover:text-white"
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    {t(labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-8 flex flex-col gap-1 border-t border-white/10 pt-5 text-[11px] text-white/45"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div>{t("chrome.footer.copyright", { year })}</div>
          <a href="mailto:hi@trypicky.co" className="hover:text-white/80">
            {t("chrome.footer.contactEmail")}
          </a>
        </div>
      </div>
    </footer>
  );
}
