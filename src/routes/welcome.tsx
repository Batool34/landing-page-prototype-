import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Globe, X, ArrowRight } from "lucide-react";
import heroImg from "@/assets/welcome-hero.jpg";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Fylo — Healthy, Made Intelligent." },
      {
        name: "description",
        content:
          "Fylo takes care of you, so you can take care of life. AI-curated lunches, delivered.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const begin = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fylo:welcomed", "1");
    }
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen w-full bg-black py-0 md:py-10">
      <div className="mx-auto w-full max-w-[420px] min-h-screen md:min-h-0 md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.4)] overflow-hidden bg-background relative flex flex-col">
        {/* Top chrome */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 pt-5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/85 backdrop-blur px-3 py-1.5 text-[11px] font-medium text-foreground/80 shadow-soft"
          >
            <Globe className="h-3.5 w-3.5" strokeWidth={2.2} />
            EN · العربية
          </button>
          <button
            type="button"
            onClick={begin}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-foreground/80 text-background backdrop-blur"
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>

        {/* Tappable card */}
        <button
          type="button"
          onClick={begin}
          className="relative flex-1 flex flex-col text-left active:scale-[0.997] transition"
        >
          {/* Hero image */}
          <div className="absolute inset-0">
            <img
              src={heroImg}
              alt="A flat lay of vibrant healthy bowls on bright marble"
              width={1024}
              height={1536}
              className="h-full w-full object-cover"
            />
            {/* Soft top wash so text always reads */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/40 to-transparent" />
            {/* Subtle blush tint at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-blush/40 to-transparent" />
          </div>

          {/* Copy */}
          <div className="relative z-10 px-7 pt-24">
            <div className="text-[13px] font-semibold tracking-[0.22em] text-primary">
              FYLO
            </div>
            <h1 className="mt-6 font-display text-[44px] leading-[0.98] tracking-tight text-foreground">
              Healthy,
              <br />
              Made <span className="italic text-primary">Intelligent.</span>
            </h1>
            <p className="mt-5 max-w-[300px] text-[13.5px] leading-snug text-foreground/75">
              We take care of you, so you can take care of life.
            </p>
            <p className="mt-2 max-w-[300px] text-[12px] leading-snug text-foreground/55">
              Supporting every version of you — healthy, unhealthy, and
              everything in between.
            </p>
          </div>

          <div className="flex-1" />
        </button>

        {/* CTA */}
        <div className="relative z-20 px-6 pb-7 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
          <button
            type="button"
            onClick={begin}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)] active:scale-[0.99] transition"
          >
            Let's Begin
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <div className="mt-3 text-center text-[10.5px] text-muted-foreground">
            Tap anywhere to continue
          </div>
        </div>
      </div>
    </div>
  );
}
