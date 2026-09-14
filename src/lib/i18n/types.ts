export type Locale = "en" | "ar";

export const LOCALE_STORAGE_KEY = "picky:locale";
export const LOCALE_CHANGED_EVENT = "picky:locale-changed";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ar";
}

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "en";
}

export function writeStoredLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    window.dispatchEvent(new Event(LOCALE_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

/** SSR + hydration-safe locale read (server snapshot is always `en`). */
export function getLocaleServerSnapshot(): Locale {
  return "en";
}

export function getLocaleSnapshot(): Locale {
  return readStoredLocale();
}

export function subscribeLocale(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onChange = () => onStoreChange();
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCALE_CHANGED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCALE_CHANGED_EVENT, onChange);
  };
}

export function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.lang = locale;
  root.dir = locale === "ar" ? "rtl" : "ltr";
  root.dataset.locale = locale;
}

type Dict = Record<string, string>;

/** Simple `{name}` interpolation. */
export function formatMessage(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`,
  );
}

export function translate(dict: Dict, key: string, vars?: Record<string, string | number>) {
  const template = dict[key] ?? key;
  return formatMessage(template, vars);
}
