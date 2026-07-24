/** Dev allowlist helpers — founder can re-join waitlist without false "already subscribed". */

function normalizeContactToken(raw: string): string {
  return raw.trim().toLowerCase();
}

function normalizePhoneToken(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("0")) d = `966${d.slice(1)}`;
  if (d.length === 9 && d.startsWith("5")) d = `966${d}`;
  return d;
}

/**
 * Contacts listed in VITE_DEV_TEST_CONTACTS (comma-separated emails and/or phones)
 * are treated as test signups: reset + rejoin allowed, marked is_test in DB.
 *
 * Example in .env / Lovable secrets:
 *   VITE_DEV_TEST_CONTACTS=you@email.com,+9665xxxxxxxx
 */
export function getDevTestContacts(): string[] {
  const raw = import.meta.env.VITE_DEV_TEST_CONTACTS ?? "";
  return raw
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
}

export function isDevTestContact(phone: string, email: string): boolean {
  const contacts = getDevTestContacts();
  if (contacts.length === 0) return false;

  const emailNorm = normalizeContactToken(email);
  const phoneNorm = normalizePhoneToken(phone);

  return contacts.some((c) => {
    if (c.includes("@")) return normalizeContactToken(c) === emailNorm;
    return normalizePhoneToken(c) === phoneNorm;
  });
}
