import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Gift, Trophy, Send, Check } from "lucide-react";
import { TabBar, phoneShellClass } from "@/components/tab-bar";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "Waitlist — Picky" },
      {
        name: "description",
        content:
          "Move up the Picky waitlist by inviting friends. Share your link and unlock priority access.",
      },
    ],
  }),
  component: Waitlist,
});

function Waitlist() {
  const [link, setLink] = useState("https://trypicky.co/i/…");
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [invited, setInvited] = useState<string[]>([]);
  const [position, setPosition] = useState<number>(119);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("fylo:waitlistPosition");
    if (stored) {
      setPosition(parseInt(stored, 10));
    } else {
      // Fallback: user landed here without completing onboarding — assign now.
      const counter = parseInt(
        localStorage.getItem("fylo:waitlistCounter") ?? "0",
        10,
      );
      const p = 119 + counter;
      localStorage.setItem("fylo:waitlistPosition", String(p));
      localStorage.setItem("fylo:waitlistCounter", String(counter + 1));
      setPosition(p);
    }

    // Unique, stable referral code per client (device).
    let refCode = localStorage.getItem("fylo:referralCode");
    if (!refCode) {
      const rand =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().replace(/-/g, "").slice(0, 6)
          : Math.random().toString(36).slice(2, 8);
      refCode = rand.toLowerCase();
      localStorage.setItem("fylo:referralCode", refCode);
    }
    setLink(`${window.location.origin}/?ref=${refCode}`);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const sendInvite = () => {
    if (!email.trim()) return;
    setInvited([email.trim(), ...invited]);
    setEmail("");
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10 overflow-x-hidden">
      <div className={phoneShellClass}>
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-2 h-6 w-32 rounded-full bg-black z-30" />

        <main className="flex-1 overflow-y-auto px-6 pt-10 pb-8">
          <Link
            to="/lunches"
            className="inline-grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft border border-black/[0.04] text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          </Link>

          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-[11px] font-medium text-blush-foreground">
            <Gift className="h-3 w-3" strokeWidth={2.5} /> Invite & climb
          </div>
          <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight">
            Move up the leaderboard or{" "}
            <span className="italic text-primary">invite a friend.</span>
          </h1>

          {/* Leaderboard card */}
          <div className="mt-6 rounded-3xl bg-card border border-black/[0.04] p-5 shadow-card">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <Trophy className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Your position
                </div>
                <div className="font-display text-[28px] leading-none tracking-tight">
                  #{position.toLocaleString()}
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-[11px] text-muted-foreground">Friends invited</div>
                <div className="text-[18px] font-semibold text-primary">{invited.length}</div>
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, 28 + invited.length * 12)}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              3 more invites unlock priority access.
            </div>
          </div>

          {/* Share link */}
          <section className="mt-6">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Your shareable link
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-card p-2 pl-4">
              <span className="flex-1 truncate text-[13px] font-medium text-foreground/90">
                {link}
              </span>
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-[12px] font-semibold text-primary-foreground transition active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" strokeWidth={3} /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" strokeWidth={2.5} /> Copy Link
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Email invite */}
          <section className="mt-6">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Waitlist a friend's email
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-card p-2 pl-4 focus-within:border-primary transition">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                placeholder="friend@email.com"
                type="email"
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={sendInvite}
                className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2.5 text-[12px] font-semibold text-background transition active:scale-[0.98]"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={2.5} /> Invite
              </button>
            </div>

            {invited.length > 0 && (
              <ul className="mt-4 space-y-2">
                {invited.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-[12px]"
                  >
                    <span className="truncate text-foreground/80">{e}</span>
                    <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                      Pending
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>

        <TabBar active="waitlist" />
      </div>
    </div>
  );
}
