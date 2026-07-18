import { Link } from "@tanstack/react-router";
import { Globe, Instagram, Twitter, Linkedin, Mail } from "lucide-react";
import type { ReactNode } from "react";
import pickyLogo from "@/assets/picky-logo.png";

type NavKey = "home" | "story" | "faq";

const NAV: { key: NavKey; label: string; to: string }[] = [
  { key: "home", label: "Home", to: "/" },
  { key: "story", label: "Our Story", to: "/our-story" },
  { key: "faq", label: "FAQ", to: "/faq" },
];

export function LandingShell({
  active,
  children,
}: {
  active: NavKey;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[oklch(0.14_0.015_25)] text-white antialiased">
      <LandingHeader active={active} />
      <main className="mx-auto w-full max-w-6xl px-5 md:px-8">{children}</main>
      <LandingFooter />
    </div>
  );
}

function LandingHeader({ active }: { active: NavKey }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[oklch(0.14_0.015_25)/0.7] border-b border-white/[0.06]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3.5 md:px-8">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={pickyLogo} alt="Picky" className="h-8 w-8 sm:h-9 sm:w-9 object-contain" width={36} height={36} />
        </Link>

        <nav className="hidden sm:flex items-center gap-1 rounded-full bg-white/[0.05] p-1 ring-1 ring-white/10">
          {NAV.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className={
                "rounded-full px-4 py-1.5 text-[13px] font-medium transition " +
                (active === item.key
                  ? "bg-white/[0.10] text-white ring-1 ring-white/15"
                  : "text-white/60 hover:text-white")
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-[12px] font-medium text-white/80 ring-1 ring-white/10"
          >
            <Globe className="h-3.5 w-3.5" strokeWidth={2.2} />
            EN
          </button>
          <Link
            to="/onboarding"
            className="inline-flex items-center rounded-full bg-white text-black px-4 py-2 text-[12.5px] font-semibold hover:bg-white/90 transition"
          >
            Open App
          </Link>
        </div>
      </div>

      {/* Mobile nav pill */}
      <nav className="sm:hidden mx-auto flex w-full max-w-6xl items-center justify-center gap-1 px-5 pb-3">
        <div className="flex items-center gap-1 rounded-full bg-white/[0.05] p-1 ring-1 ring-white/10">
          {NAV.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className={
                "rounded-full px-3.5 py-1.5 text-[12px] font-medium transition " +
                (active === item.key
                  ? "bg-white/[0.10] text-white ring-1 ring-white/15"
                  : "text-white/60")
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/trypicky", Icon: Instagram },
  { label: "X", href: "https://x.com/trypicky", Icon: Twitter },
  { label: "LinkedIn", href: "https://linkedin.com/company/trypicky", Icon: Linkedin },
  { label: "Email", href: "mailto:hi@trypicky.co", Icon: Mail },
];

function LandingFooter() {
  return (
    <footer className="mt-24 border-t border-white/[0.06]">
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <img src={pickyLogo} alt="Picky" className="h-9 w-9 object-contain" width={36} height={36} loading="lazy" />
            <p className="mt-4 text-[13.5px] leading-relaxed text-white/55">
              Healthy, made intelligent. Picky learns your habits to recommend
              and compare your perfect daily lunches from your favorite local
              apps.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-14">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                Company
              </div>
              <ul className="mt-4 space-y-2.5 text-[13.5px]">
                <li><Link to="/" className="text-white/75 hover:text-white">Home</Link></li>
                <li><Link to="/our-story" className="text-white/75 hover:text-white">Our Story</Link></li>
                <li><Link to="/faq" className="text-white/75 hover:text-white">FAQ</Link></li>
                <li><Link to="/onboarding" className="text-white/75 hover:text-white">Open App</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                Follow
              </div>
              <ul className="mt-4 space-y-2.5 text-[13.5px]">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 text-white/75 hover:text-white"
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col-reverse gap-4 border-t border-white/[0.06] pt-6 text-[12px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} Picky. All rights reserved. Riyadh, KSA.</div>
          <div className="flex items-center gap-4">
            <a href="mailto:hi@trypicky.co" className="hover:text-white/80">hi@trypicky.co</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
