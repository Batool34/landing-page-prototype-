import { useCallback, useEffect, useState } from "react";
import { syncLead, logEvent } from "@/lib/tracking";


const KEY = "fylo:saved";
const EVT = "fylo:saved";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVT));
}

export function useSavedMeals() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const sync = () => setIds(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    const current = read();
    const adding = !current.includes(id);
    const next = adding ? [...current, id] : current.filter((x) => x !== id);
    write(next);
    setIds(next);
    logEvent(adding ? "meal_saved" : "meal_unsaved", { mealId: id });
    syncLead();
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((x) => x !== id);
    write(next);
    setIds(next);
    logEvent("meal_unsaved", { mealId: id });
    syncLead();
  }, []);

  return { ids, count: ids.length, isSaved, toggle, remove };
}
