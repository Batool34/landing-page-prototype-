/** Founder / test contacts — excluded from waitlist duplicates and admin metrics. */

function normalizeContactToken(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Normalize SA / intl phones to digits like 9665xxxxxxxx. */
export function normalizePhoneToken(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("0")) d = `966${d.slice(1)}`;
  if (d.length === 9 && d.startsWith("5")) d = `966${d}`;
  return d;
}

/**
 * Always-excluded founder contacts (your laptop + phone testing).
 * Extra contacts can be added via VITE_DEV_TEST_CONTACTS.
 */
export const FOUNDER_TEST_CONTACTS = [
  "batoolin34@gmail.com",
  "0540535190",
  "+966540535190",
  "966540535190",
] as const;

/**
 * Contacts listed in VITE_DEV_TEST_CONTACTS (comma-separated emails and/or phones)
 * are treated as test signups: reset + rejoin allowed, marked is_test in DB.
 */
export function getDevTestContacts(): string[] {
  const raw = import.meta.env.VITE_DEV_TEST_CONTACTS ?? "";
  const fromEnv = raw
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
  return [...FOUNDER_TEST_CONTACTS, ...fromEnv];
}

export function isDevTestContact(phone: string, email: string): boolean {
  const contacts = getDevTestContacts();
  const emailNorm = normalizeContactToken(email || "");
  const phoneNorm = normalizePhoneToken(phone || "");
  if (!emailNorm && !phoneNorm) return false;

  return contacts.some((c) => {
    if (c.includes("@")) {
      return emailNorm.length > 0 && normalizeContactToken(c) === emailNorm;
    }
    return phoneNorm.length > 0 && normalizePhoneToken(c) === phoneNorm;
  });
}

export function isExcludedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return isDevTestContact("", email);
}

export function isExcludedPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  return isDevTestContact(phone, "");
}

/** True if this lead/event identity belongs to a founder/test contact. */
export function isExcludedIdentity(
  phone: string | null | undefined,
  email: string | null | undefined,
): boolean {
  return isDevTestContact(phone || "", email || "");
}
