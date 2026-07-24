import { ar } from "./ar";
import { en } from "./en";
import type { Locale } from "../types";

export { ar, en };

export const messages: Record<Locale, Record<string, string>> = {
  en,
  ar,
};
