import type { Locale } from "./types";

/** Arabic display names for every meal id in `mealPool`. */
export const mealNamesAr: Record<string, string> = {
  "shb-kabab-chicken": "طبق كباب دجاج",
  "shb-kabab-halabi": "طبق كباب حلبي",
  "lpw-dunk-it": "جست دانك إت",
  "lpw-dunk-pepperoni": "جست دانك إت بيبروني",
  "lpw-dunk-margarita": "جست دانك إت مارغريتا",
  "swk-lumi-tikka": "لومي تكة",
  "swk-greek-yogurt": "تكة زبادي يوناني",
  "swk-spicy-tikka": "تكة حارة",
  "calo-tomato-pasta": "باستا طماطم كريمية",
  "calo-fiesta-chicken": "بول فييستا دجاج",
  "calo-butter-chicken": "دجاج بالزبدة",
  "slt-downtown-cobb": "سلطة كوب داون تاون",
  "slt-asian-salad": "سلطة آسيوية",
  "slt-buffalo-chicken": "سلطة دجاج بافلو",
  "abk-big-baik": "بيغ بايك",
  "abk-4pc-meal": "وجبة ٤ قطع دجاج",
  "abk-fillet-sandwich": "ساندوتش فيليه دجاج",
  "shm-abo-alsawarikh": "أبو الصواريخ",
  "shm-raj-raj": "راج راج",
  "shm-two-arabi": "عربيين",
  "hrf-big-herfy-cheese": "بيغ هرفي بالجبن",
  "hrf-super-herfy": "سوبر هرفي",
  "hrf-double-grilled-chicken": "دبل دجاج مشوي",
  "kdu-chicken-sandwich": "ساندوتش دجاج كودو",
  "kdu-chicken-burger": "برغر دجاج",
  "kdu-chicken-salad": "سلطة دجاج كودو",
  "mst-alfredo-chicken": "بيتزا ألفريدو دجاج",
  "mst-dynamite-chicken": "بيتزا دايناميت دجاج",
  "mst-pepperoni": "بيتزا بيبروني",
  "mcd-big-mac": "بيغ ماك",
  "mcd-big-mac-meal": "وجبة بيغ ماك",
  "mcd-mc-chicken": "ماك تشيكن",
  "of-crispy-chicken-shawarma": "شاورما دجاج مقرمشة",
  "of-crispy-falafel": "ساندوتش فلافل مقرمش",
  "of-crispy-beef-shawarma": "شاورما لحم مقرمشة",
  "cb-original": "الأصلي CB",
  "cb-spicy-red": "سبايسي رد",
  "cb-black-beetroot": "بلاك بيتروت",
};

export function getMealName(
  id: string,
  locale: Locale,
  fallback: string,
): string {
  if (locale === "ar") {
    return mealNamesAr[id] ?? fallback;
  }
  return fallback;
}
