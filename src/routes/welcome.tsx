import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Globe, ArrowRight } from "lucide-react";
import { useState } from "react";
import logoAsset from "@/assets/fylo-logo.asset.json";
import heroImg from "@/assets/welcome-hero.jpg";
import { syncLead, logEvent } from "@/lib/tracking";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Fylo — We take care of you, so you can take care of life." },
      {
        name: "description",
        content:
          "Fylo learns your habits to recommend and compare your perfect daily lunches from your favorite local apps.",
      },
    ],
  }),
  component: Welcome,
});

function ensureVisitorId() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("fylo:visitorId")) {
    const vid =
      (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
    localStorage.setItem("fylo:visitorId", vid);
  }
}

function Welcome() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        await logEvent("waitlist_phone_captured", { phone: formatted, source: "welcome" });
      } catch {
        /* ignore */
      }
    }
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-[oklch(0.16_0.01_25)] text-white">
        {/* Hero image */}
        <div className="relative h-[52vh] min-h-[360px] w-full overflow-hidden">
          <img
            src={heroImg}
            alt="Fylo curated healthy bowls"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-[oklch(0.16_0.01_25)]" />

          {/* Top chrome */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-5">
            <img
              src={logoAsset.url}
              alt="Fylo"
              className="h-9 w-auto drop-shadow"
              width={72}
              height={36}
            />
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-3 py-1.5 text-[11px] font-medium text-white/90 ring-1 ring-white/15"
            >
              <Globe className="h-3.5 w-3.5" strokeWidth={2.2} />
              EN
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="flex flex-1 flex-col px-6 pb-8 -mt-6">
          {/* Waitlist pill */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/80 ring-1 ring-white/12">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Now taking waitlist
            </span>
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-center font-display text-[38px] leading-[1.02] tracking-tight text-white">
            We take care of{" "}
            <span className="italic text-primary">you,</span>
            <br />
            so you can take
            <br />
            care of life.
          </h1>

          <p className="mx-auto mt-5 max-w-[320px] text-center text-[13.5px] leading-relaxed text-white/65">
            Supporting every version of you—healthy, unhealthy, and everything
            in between. Fylo learns your habits to recommend and compare your
            perfect daily lunches from your favorite local apps.
          </p>

          <div className="flex-1" />

          {/* Phone input */}
          <div className="mt-8">
            <div className="flex items-center gap-1.5 rounded-full bg-white/6 p-1.5 ring-1 ring-white/10 focus-within:ring-white/25 transition">
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

            {/* Provider strip */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-white/45">
              <span>Compares across</span>
              <span className="font-semibold text-white/75">Jahez</span>
              <span className="text-white/25">·</span>
              <span className="font-semibold text-white/75">HungerStation</span>
              <span className="text-white/25">·</span>
              <span className="font-semibold text-white/75">Keeta</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
