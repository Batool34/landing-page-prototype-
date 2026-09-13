import type { FlavorId, Meal, ProteinFocus, StyleId } from "@/lib/meals";

export function inferMealTaste(m: Meal): {
  proteinFocus: ProteinFocus;
  flavor: FlavorId;
  style: StyleId;
} {
  if (m.proteinFocus && m.flavor && m.style) {
    return { proteinFocus: m.proteinFocus, flavor: m.flavor, style: m.style };
  }
  const n = `${m.name} ${m.restaurant}`.toLowerCase();
  let proteinFocus: ProteinFocus = "chicken";
  if (/falafel|veg|salad|margarita|margherita|pasta/.test(n) && !/chicken|beef|meat|shawarma|burger|kabab|tikka/.test(n))
    proteinFocus = "veg";
  else if (/beef|steak|herfy|pepperoni|big mac|cb\b|century/.test(n)) proteinFocus = "beef";
  else if (/lamb|halabi/.test(n)) proteinFocus = "lamb";
  else if (/fish|shrimp|seafood/.test(n)) proteinFocus = "seafood";
  else if (/chicken|shawarma|tikka|baik|nugget|mcchicken/.test(n)) proteinFocus = "chicken";

  let flavor: FlavorId = "mild";
  if (/spicy|dynamite|buffalo|jalapeno|shatta|fiery|chili|hot/.test(n)) flavor = "spicy";
  else if (/salad|fresh|lumi|greek|light|fit/.test(n)) flavor = "fresh";
  else if (/butter|cheese|alfredo|rich|creamy|dunk|mac/.test(n)) flavor = "rich";

  let style: StyleId = "grilled";
  if (/salad|cobb|raw/.test(n)) style = "raw";
  else if (/pizza|pasta|baked|dunk/.test(n)) style = "baked";
  else if (/fried|crispy|broast|nugget|fillet sandwich|baik|falafel|burger/.test(n)) style = "fried";
  else if (/grill|tikka|shawarma|kabab|mousahab/.test(n)) style = "grilled";

  return {
    proteinFocus: m.proteinFocus ?? proteinFocus,
    flavor: m.flavor ?? flavor,
    style: m.style ?? style,
  };
}

export function priceBucket(price: number | null): string {
  if (price == null) return "price:unknown";
  if (price < 30) return "price:under30";
  if (price < 45) return "price:30-44";
  if (price < 60) return "price:45-59";
  return "price:60plus";
}

/** Feature keys used for taste weights and similarity. */
export function mealFeatureKeys(m: Meal): string[] {
  const t = inferMealTaste(m);
  return [
    `meal:${m.id}`,
    `restaurant:${m.restaurantSlug}`,
    `cuisine:${m.cuisine}`,
    `protein:${t.proteinFocus}`,
    `flavor:${t.flavor}`,
    `style:${t.style}`,
    priceBucket(m.basePrice),
  ];
}

export function mealSimilarityScore(a: Meal, b: Meal): number {
  if (a.id === b.id) return 0;
  let s = 0;
  if (a.restaurantSlug === b.restaurantSlug) s += 4;
  if (a.cuisine === b.cuisine) s += 3;
  const ta = inferMealTaste(a);
  const tb = inferMealTaste(b);
  if (ta.proteinFocus === tb.proteinFocus) s += 2;
  if (ta.flavor === tb.flavor) s += 1.5;
  if (ta.style === tb.style) s += 1.5;
  if (a.basePrice != null && b.basePrice != null) {
    const d = Math.abs(a.basePrice - b.basePrice);
    if (d <= 5) s += 2;
    else if (d <= 12) s += 1;
  }
  return s;
}
