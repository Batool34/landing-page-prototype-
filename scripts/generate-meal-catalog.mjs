#!/usr/bin/env node
/**
 * Build src/generated/meal-catalog.json from data/menu_items_full.csv
 * and optional data/restaurants.csv (HungerStation scrape).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");
const outDir = join(root, "src", "generated");
const menuPath = join(dataDir, "menu_items_full.csv");
const restPath = join(dataDir, "restaurants.csv");
const outPath = join(outDir, "meal-catalog.json");
const onboardingSlicePath = join(outDir, "onboarding-slice.json");

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80";
const SLOT = "Lunch · 12:30 PM";

/** Restaurants removed from Picky (slug from menu CSV). */
const EXCLUDED_RESTAURANT_SLUGS = new Set(["baba-khabbaz-170647"]);

function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = "";
  let row = [];
  let inQuotes = false;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
        continue;
      }
      if (c === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\n" || (c === "\r" && text[i + 1] === "\n")) {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += c === "\r" ? 2 : 1;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((c) => c.trim())).map((r) => {
    const o = {};
    headers.forEach((h, idx) => {
      o[h] = (r[idx] ?? "").trim();
    });
    return o;
  });
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function hashSuffix(slug, itemName) {
  return createHash("sha1").update(`${slug}\0${itemName}`).digest("hex").slice(0, 8);
}

function mapCuisine(cuisinesStr, category, itemName, restaurantName) {
  const s = `${cuisinesStr} ${category} ${itemName} ${restaurantName}`.toLowerCase();
  if (/italian|pizza|pasta/.test(s)) return "it";
  if (/asian|indian|thai|chinese|sushi|sea food|seafood/.test(s)) return "as";
  if (/healthy|salad|juice|fit|binge/.test(s) && !/burger|pizza|shawarma/.test(s)) return "hl";
  if (/american|burger|fast food|sandwich/.test(s)) return "us";
  if (/arabic|saudi|shawarma|falafel|grill|lebanese|pastries|kabab/.test(s)) return "ar";
  if (/dessert|bakery|coffee|beverage/.test(s)) return "ar";
  return "ar";
}

function inferGoals(cuisine, name) {
  const n = name.toLowerCase();
  if (cuisine === "hl" || /salad|light|healthy/.test(n)) return ["healthy", "lose", "maintain"];
  if (/meal|platter|box|family|large|double|super/.test(n)) return ["gain", "maintain"];
  return ["maintain", "healthy", "gain"];
}

function inferDiets(cuisine, name) {
  const n = name.toLowerCase();
  if (/falafel|veg|salad|margherita/.test(n) && !/chicken|beef|meat|shawarma/.test(n)) {
    return ["veg", "balanced"];
  }
  if (/grill|tikka|shawarma|chicken|protein|kabab/.test(n)) return ["highprotein", "balanced"];
  if (cuisine === "hl") return ["balanced", "lowcarb"];
  return ["balanced"];
}

function inferTaste(name, restaurant) {
  const n = `${name} ${restaurant}`.toLowerCase();
  let proteinFocus = "chicken";
  if (/falafel|veg|salad|margherita/.test(n) && !/chicken|beef|meat|shawarma|burger/.test(n)) {
    proteinFocus = "veg";
  } else if (/beef|steak|pepperoni|burger|herfy/.test(n)) proteinFocus = "beef";
  else if (/lamb|halabi/.test(n)) proteinFocus = "lamb";
  else if (/fish|shrimp|seafood/.test(n)) proteinFocus = "seafood";

  let flavor = "mild";
  if (/spicy|dynamite|buffalo|jalapeno|hot|chili/.test(n)) flavor = "spicy";
  else if (/salad|fresh|greek|light/.test(n)) flavor = "fresh";
  else if (/cheese|alfredo|butter|cream|chocolate/.test(n)) flavor = "rich";

  let style = "grilled";
  if (/salad|cobb/.test(n)) style = "raw";
  else if (/pizza|pasta|baked/.test(n)) style = "baked";
  else if (/fried|crispy|nugget|broast|falafel/.test(n)) style = "fried";
  else if (/grill|shawarma|tikka|kabab/.test(n)) style = "grilled";

  return { proteinFocus, flavor, style };
}

function parsePrice(raw) {
  const n = parseFloat(String(raw).replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

function inferMenuRole(category, itemName) {
  const c = (category || "").toLowerCase().trim();
  const n = (itemName || "").toLowerCase();
  const extraExact = new Set([
    "sides",
    "desserts",
    "drinks",
    "cold drinks",
    "hot drinks",
    "beverages",
    "sauces",
    "appetizers",
    "sweets",
    "soft drinks",
    "juices",
    "hot beverages",
    "cold beverages",
  ]);
  if (extraExact.has(c)) return "extra";
  if (/drink|beverage|juice|dessert|sweet|sauce|side|appetizer|coffee|shake|kunafa|cocktail/i.test(c)) {
    return "extra";
  }
  if (/salad/i.test(c) && !/meal|box|platter/i.test(n)) return "extra";
  return "main";
}

function loadRestaurants() {
  const map = new Map();
  if (!existsSync(restPath)) return map;
  const rows = parseCsv(readFileSync(restPath, "utf8"));
  for (const r of rows) {
    if (!r.restaurant_slug) continue;
    map.set(r.restaurant_slug, {
      name: r.name || r.restaurant_slug,
      cuisines: r.cuisines || "",
      etaLo: r.eta_lo ? parseInt(r.eta_lo, 10) : null,
      etaHi: r.eta_hi ? parseInt(r.eta_hi, 10) : null,
      sourceUrl: r.source_url || "",
    });
  }
  return map;
}

function pickOnboardingIds(meals) {
  const bySlug = new Map();
  for (const m of meals) {
    if (!bySlug.has(m.restaurantSlug)) bySlug.set(m.restaurantSlug, m);
  }
  const wantSlugs = [
    "kudu-124123",
    "shawermer-classic-26516",
    "famez-pizza-192270",
    "falafel-themar-93729",
    "texas-chicken-109850",
    "d-smash-burger-186132",
    "popeyes-120082",
    "fit-house-161754",
    "kcal-180556",
    "maidan-alshaam-131591",
    "burger-king-108323",
  ];
  const ids = [];
  for (const slug of wantSlugs) {
    const m = bySlug.get(slug);
    if (m) ids.push(m.id);
  }
  if (ids.length < 8) {
    for (const m of meals) {
      if (ids.length >= 11) break;
      if (!ids.includes(m.id) && m.basePrice != null && m.image) ids.push(m.id);
    }
  }
  return ids.slice(0, 11);
}

function pickOnboardingPairs(meals) {
  const find = (pred) => meals.find(pred);
  const left1 =
    find((m) => m.restaurantSlug === "kudu-124123" && /burger/i.test(m.name)) ??
    find((m) => m.restaurantSlug === "kudu-124123");
  const right1 =
    find((m) => m.restaurantSlug === "famez-pizza-192270" && /pizza|alfredo/i.test(m.name)) ??
    find((m) => m.restaurantSlug === "famez-pizza-192270");
  const left2 =
    find((m) => m.restaurantSlug === "shawermer-classic-26516") ??
    find((m) => /shawarma/i.test(m.name));
  const right2 =
    find((m) => m.restaurantSlug === "falafel-themar-93729" && /falafel/i.test(m.name)) ??
    find((m) => /falafel/i.test(m.name));
  const left3 =
    find((m) => m.restaurantSlug === "d-smash-burger-186132") ??
    find((m) => /burger/i.test(m.name) && m.cuisine === "us");
  const right3 =
    find((m) => m.restaurantSlug === "kcal-180556" && /salad/i.test(m.name)) ??
    find((m) => m.cuisine === "hl");
  const left4 =
    find((m) => m.restaurantSlug === "texas-chicken-109850" && /jalapeno/i.test(m.name)) ??
    find((m) => m.restaurantSlug === "texas-chicken-109850");
  const right4 =
    find((m) => m.restaurantSlug === "fit-house-161754" && /chicken pizza/i.test(m.name)) ??
    find((m) => m.restaurantSlug === "fit-house-161754");
  const left5 =
    find((m) => m.restaurantSlug === "popeyes-120082" && /national day/i.test(m.name)) ??
    find((m) => m.restaurantSlug === "popeyes-120082");
  const right5 =
    find((m) => m.restaurantSlug === "kcal-180556" && /high protein/i.test(m.name)) ??
    find((m) => m.restaurantSlug === "kcal-180556" && /combo/i.test(m.name));
  const left6 =
    find((m) => m.restaurantSlug === "falafel-themar-93729" && /gathering/i.test(m.name)) ??
    find((m) => m.restaurantSlug === "falafel-themar-93729");
  const right6 =
    find((m) => m.restaurantSlug === "burger-king-108323" && /whopper/i.test(m.name)) ??
    find((m) => m.restaurantSlug === "burger-king-108323");

  return {
    pair1: { left: left1?.id ?? meals[0]?.id, right: right1?.id ?? meals[1]?.id },
    pair2: { left: left2?.id ?? meals[2]?.id, right: right2?.id ?? meals[3]?.id },
    pair3: { left: left3?.id ?? meals[4]?.id, right: right3?.id ?? meals[5]?.id },
    pair4: { left: left4?.id ?? meals[6]?.id, right: right4?.id ?? meals[7]?.id },
    pair5: { left: left5?.id ?? meals[8]?.id, right: right5?.id ?? meals[9]?.id },
    pair6: { left: left6?.id ?? meals[10]?.id, right: right6?.id ?? meals[11]?.id },
  };
}

function main() {
  if (!existsSync(menuPath)) {
    console.error(`Missing ${menuPath}`);
    process.exit(1);
  }

  const restaurants = loadRestaurants();
  const menuRows = parseCsv(readFileSync(menuPath, "utf8"));
  const idSeen = new Map();
  const meals = [];

  for (const row of menuRows) {
    const slug = row.restaurant_slug || slugify(row.restaurant || "unknown");
    if (EXCLUDED_RESTAURANT_SLUGS.has(slug)) continue;
    const itemName = row.item_name || "Item";
    const restMeta = restaurants.get(slug);
    const restaurant = restMeta?.name || row.restaurant || slug;
    const cuisines = restMeta?.cuisines || "";
    const category = row.category || "";

    let id = `${slug}-${slugify(itemName)}`;
    if (idSeen.has(id)) {
      id = `${id}-${hashSuffix(slug, itemName)}`;
    }
    idSeen.set(id, true);

    const cuisine = mapCuisine(cuisines, category, itemName, restaurant);
    const taste = inferTaste(itemName, restaurant);
    const image = (row.image_source_url || "").trim() || PLACEHOLDER_IMAGE;
    const basePrice = parsePrice(row.price_sar);
    const sourceUrl =
      restMeta?.sourceUrl ||
      `https://hungerstation.com/sa-en/restaurants/regions/riyadh/narjis/${slug}`;

    meals.push({
      id,
      slot: SLOT,
      name: itemName,
      restaurant,
      restaurantSlug: slug,
      category,
      menuRole: inferMenuRole(category, itemName),
      description: row.description || "",
      kcal: null,
      image,
      basePrice,
      cuisine,
      goals: inferGoals(cuisine, itemName),
      diets: inferDiets(cuisine, itemName),
      allergens: [],
      proteinFocus: taste.proteinFocus,
      flavor: taste.flavor,
      style: taste.style,
      etaLo: restMeta?.etaLo ?? null,
      etaHi: restMeta?.etaHi ?? null,
      sourceUrl,
    });
  }

  const restaurantSlugs = new Set(meals.map((m) => m.restaurantSlug));
  const onboardingDishIds = pickOnboardingIds(meals);
  const onboardingPairs = pickOnboardingPairs(meals);

  mkdirSync(outDir, { recursive: true });
  const payload = {
    restaurantCount: restaurantSlugs.size,
    onboardingDishIds,
    onboardingPairs,
    meals,
  };
  writeFileSync(outPath, JSON.stringify(payload));

  const pairIds = Object.values(onboardingPairs).flatMap((p) => [p.left, p.right]);
  const onboardingMealIds = new Set([...onboardingDishIds, ...pairIds]);
  const onboardingMeals = meals.filter((m) => onboardingMealIds.has(m.id));
  writeFileSync(
    onboardingSlicePath,
    JSON.stringify({
      onboardingDishIds,
      onboardingPairs,
      meals: onboardingMeals,
    }),
  );

  console.log(
    `Wrote ${meals.length} meals, ${restaurantSlugs.size} restaurants -> ${outPath}`,
  );
  console.log(
    `Wrote onboarding slice (${onboardingMeals.length} meals) -> ${onboardingSlicePath}`,
  );
  if (!existsSync(restPath)) {
    console.warn("Note: data/restaurants.csv not found; used menu names + inferred cuisines.");
  }
}

main();
