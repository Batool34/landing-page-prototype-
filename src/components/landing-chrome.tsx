import { Link } from "@tanstack/react-router";
import { Globe, Instagram, Linkedin, Mail } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import logoAsset from "@/assets/fylo-logo.asset.json";
import { trackEvent } from "@/lib/analytics";

type NavKey = "home" | "story" | "faq";

const NAV: { key: NavKey; label: string; to: string }[] = [
  { key: "home", label: "Home", to: "/welcome" },
  { key: "story", label: "Our Story", to: "/our-story" },
  { key: "faq", label: "FAQ", to: "/faq" },
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
      className="fylo-dark relative min-h-screen overflow-x-hidden font-sans"
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
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {heroImage ? (
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
          style={{ transform: "scale(1.05)" }}
        />
      ) : (
        <div className="h-full w-full bg-[oklch(0.14_0.015_25)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-background/15 to-background/85" />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 20%, oklch(0.14 0.02 20 / 0.65) 80%)",
        }}
      />
      <div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-[0.15]"
        style={{ background: "oklch(0.62 0.24 27)", filter: "blur(140px)" }}
      />
      <div
        className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full opacity-[0.15]"
        style={{ background: "oklch(0.82 0.15 85)", filter: "blur(140px)" }}
      />
    </div>
  );
}

function TopNav({ active }: { active: NavKey }) {
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

  return (
    <header className="fixed inset-x-0 top-0 z-40" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto max-w-md px-4 py-3">
        <div className="glass-pill flex items-center justify-between gap-2 rounded-full px-2 py-1.5">
          <button
            type="button"
            onClick={scrollTop}
            className="flex min-w-0 shrink-0 items-center gap-1.5 pl-1"
            aria-label="Fylo home"
          >
            <img
              src={logoAsset.url}
              alt="Fylo"
              className="h-8 w-8 shrink-0"
              style={{ filter: "drop-shadow(0 4px 18px oklch(0.62 0.24 27 / 0.55))" }}
            />
          </button>

          <nav className="flex items-center gap-0.5">
            {NAV.map((item) => {
              const isActive = active === item.key;
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => trackEvent("nav_click", { to: item.to })}
                  className={
                    "rounded-full px-3 py-1.5 text-[12px] font-medium transition " +
                    (isActive ? "bg-white/[0.12] text-white ring-1 ring-white/15" : "text-white/65 hover:text-white")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div ref={ref} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="inline-flex h-9 items-center gap-1 rounded-full bg-white/[0.05] px-2.5 text-[12px] font-medium text-white ring-1 ring-white/10"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
            >
              <Globe className="h-3.5 w-3.5" strokeWidth={2} />
              EN
            </button>
            {langOpen && (
              <div role="listbox" className="glass-panel absolute right-0 top-11 w-40 overflow-hidden p-1 text-[13px]">
                <button
                  role="option"
                  aria-selected
                  className="flex w-full items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-left text-white"
                >
                  <span>English</span>
                  <span className="text-white/40">EN</span>
                </button>
                <div
                  aria-disabled="true"
                  className="mt-0.5 flex w-full cursor-not-allowed items-center justify-between rounded-xl px-3 py-2 text-left text-white/40"
                  title="Arabic support coming soon"
                >
                  <span>العربية</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      backgroundColor: "oklch(0.82 0.15 85 / 0.15)",
                      color: "oklch(0.82 0.15 85)",
                    }}
                  >
                    Soon
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/tryfylo", Icon: Instagram },
  { label: "LinkedIn", href: "https://linkedin.com/company/tryfylo", Icon: Linkedin },
  { label: "Email", href: "mailto:hi@tryfylo.co", Icon: Mail },
];

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-16 border-t border-white/10 bg-background/40 backdrop-blur-xl">
      <div className="mx-auto max-w-md px-5 py-8">
        <div className="flex items-center gap-2">
          <img src={logoAsset.url} alt="Fylo" className="h-8 w-8" />
          <span className="text-hero text-[18px] text-white">Fylo</span>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-white/60">
          Healthy, made intelligent. One perfect lunch, every workday.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-6 text-[13px]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Company</div>
            <ul className="mt-3 space-y-2">
              {NAV.map((item) => (
                <li key={item.key}>
                  <Link to={item.to} className="text-white/75 hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Follow</div>
            <ul className="mt-3 space-y-2">
              {SOCIALS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 text-white/75 hover:text-white"
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    {label}
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
          <div>© {year} Fylo · Riyadh, KSA</div>
          <a href="mailto:hi@tryfylo.co" className="hover:text-white/80">
            hi@tryfylo.co
          </a>
        </div>
      </div>
    </footer>
  );
}
