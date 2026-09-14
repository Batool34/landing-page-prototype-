import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { messages } from "./messages";
import {
  applyDocumentLocale,
  getLocaleServerSnapshot,
  getLocaleSnapshot,
  subscribeLocale,
  type Locale,
  writeStoredLocale,
  translate,
} from "./types";

type LocaleContextValue = {
  locale: Locale;
  isRtl: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getLocaleServerSnapshot,
  );

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    writeStoredLocale(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(messages[locale], key, vars),
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      isRtl: locale === "ar",
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
