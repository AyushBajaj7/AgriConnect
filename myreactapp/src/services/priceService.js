/**
 * File: priceService.js
 * Description: Fetches mandi prices through the backend. Falls back to
 *              clearly labeled curated reference data when live data is unavailable.
 * Used in: pages/CropPrices/CropPrices.js
 */

import { getBackendOrigin } from "./backendOrigin";

const API_BASE_URL = getBackendOrigin();
const REFERENCE_CACHE_KEY = "agriconnect.referencePrices.v1";
const PRICE_REQUEST_TIMEOUT_MS = 35000;

/** Maps commodity keywords to display categories. */
const CATEGORY_KEYWORDS = {
  crops: [
    "wheat",
    "rice",
    "paddy",
    "maize",
    "cotton",
    "sugarcane",
    "mustard",
    "jowar",
    "bajra",
    "toor",
    "moong",
    "arhar",
    "turmeric",
    "ginger",
    "tea",
    "coffee",
    "pepper",
    "soybean",
    "jute",
    "tobacco",
  ],
  vegetables: [
    "onion",
    "potato",
    "tomato",
    "cauliflower",
    "cabbage",
    "brinjal",
    "pea",
    "capsicum",
    "garlic",
    "carrot",
    "pumpkin",
    "cucumber",
    "gourd",
    "snakeguard",
    "snake gourd",
    "snake guard",
    "parval",
    "pointed gourd",
    "bitter gourd",
    "bottle gourd",
    "ridge gourd",
    "okra",
    "bhindi",
    "beans",
    "bean",
    "chilli",
    "chili",
    "spinach",
    "coriander",
    "radish",
    "turnip",
    "beetroot",
  ],
  fruits: [
    "mango",
    "banana",
    "apple",
    "grape",
    "orange",
    "litchi",
    "coconut",
    "pomegranate",
    "papaya",
    "guava",
    "pineapple",
    "watermelon",
    "muskmelon",
    "lemon",
    "lime",
    "jackfruit",
  ],
  livestock: [
    "fish",
    "poultry",
    "egg",
    "cock",
    "chicken",
    "hen",
    "duck",
    "goat",
    "mutton",
    "beef",
    "broiler",
    "shrimp",
    "prawn",
    "katla",
    "rohu",
    "singhra",
    "malli",
  ],
  seeds: [
    "groundnut",
    "sunflower",
    "castor",
    "guar",
    "sesame",
    "cotton seed",
    "paddy seed",
    "maize seed",
  ],
  fertilizers: [
    "fertilizer",
    "fertiliser",
    "urea",
    "dap",
    "mop",
    "ssp",
    "npk",
    "compost",
    "manure",
    "potash",
  ],
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCategoryText(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasKeyword(normalizedCommodity, keyword) {
  const normalizedKeyword = normalizeCategoryText(keyword);

  if (!normalizedKeyword) {
    return false;
  }

  return new RegExp(`(^| )${escapeRegExp(normalizedKeyword)}( |$)`).test(
    normalizedCommodity,
  );
}

function categorize(commodity = "") {
  const normalized = normalizeCategoryText(commodity);
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => hasKeyword(normalized, keyword))) return cat;
  }
  return "crops";
}

const priceHistory = {};

function makePriceId(record) {
  return [
    record.State || record.state,
    record.Market || record.market,
    record.Commodity || record.commodity,
    record.Variety || record.variety || "local",
  ]
    .join("_")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getTrend(id, currentPrice) {
  const prev = priceHistory[id];
  priceHistory[id] = currentPrice;
  if (prev === undefined) return "stable";
  if (currentPrice > prev) return "up";
  if (currentPrice < prev) return "down";
  return "stable";
}

function normalizeApiRecord(record, index) {
  const modal = parseInt(record.Modal_Price || record.modal_price, 10) || 0;
  const market = record.Market || record.market || "";
  const commodity = record.Commodity || record.commodity || "";
  const id = makePriceId(record) || `api_${index}`;
  return {
    id,
    market: market,
    state: record.State || record.state || "",
    commodity: commodity,
    variety: record.Variety || record.variety || "Local",
    category: categorize(commodity),
    modalPrice: modal,
    minPrice: parseInt(record.Min_Price || record.min_price, 10) || 0,
    maxPrice: parseInt(record.Max_Price || record.max_price, 10) || 0,
    distance: null,
    trend: getTrend(id, modal),
    source: "live",
  };
}

function makeGroupKey(record) {
  return [record.state, record.market, record.commodity, record.variety]
    .join("|")
    .toLowerCase();
}

function mergePriceRecords(records) {
  const grouped = new Map();

  for (const record of records) {
    const key = makeGroupKey(record);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, { ...record, groupCount: 1 });
      continue;
    }

    const totalCount = existing.groupCount + 1;
    grouped.set(key, {
      ...existing,
      minPrice: Math.min(existing.minPrice, record.minPrice),
      maxPrice: Math.max(existing.maxPrice, record.maxPrice),
      modalPrice: Math.round(
        (existing.modalPrice * existing.groupCount + record.modalPrice) / totalCount,
      ),
      groupCount: totalCount,
    });
  }

  return Array.from(grouped.values()).map(({ groupCount, ...record }) => record);
}

/** Static fallback dataset — 55 items across major mandis. */
const STATIC_PRICES = [
  {
    id: "s1",
    market: "Delhi Azadpur",
    state: "Delhi",
    commodity: "Onion",
    variety: "Red",
    category: "vegetables",
    modalPrice: 1500,
    minPrice: 1200,
    maxPrice: 1800,
    distance: 12,
  },
  {
    id: "s2",
    market: "Delhi Azadpur",
    state: "Delhi",
    commodity: "Potato",
    variety: "Kufri Bahar",
    category: "vegetables",
    modalPrice: 1100,
    minPrice: 900,
    maxPrice: 1300,
    distance: 12,
  },
  {
    id: "s3",
    market: "Delhi Azadpur",
    state: "Delhi",
    commodity: "Tomato",
    variety: "Hybrid",
    category: "vegetables",
    modalPrice: 2200,
    minPrice: 1800,
    maxPrice: 2800,
    distance: 12,
  },
  {
    id: "s4",
    market: "Delhi Azadpur",
    state: "Delhi",
    commodity: "Cauliflower",
    variety: "Pusa Snowball",
    category: "vegetables",
    modalPrice: 1200,
    minPrice: 1000,
    maxPrice: 1400,
    distance: 12,
  },
  {
    id: "s5",
    market: "Delhi Azadpur",
    state: "Delhi",
    commodity: "Cabbage",
    variety: "Golden Acre",
    category: "vegetables",
    modalPrice: 800,
    minPrice: 600,
    maxPrice: 1000,
    distance: 12,
  },
  {
    id: "s6",
    market: "Karnal Mandi",
    state: "Haryana",
    commodity: "Wheat",
    variety: "Sharbati",
    category: "crops",
    modalPrice: 2800,
    minPrice: 2600,
    maxPrice: 3000,
    distance: 130,
  },
  {
    id: "s7",
    market: "Ambala Mandi",
    state: "Haryana",
    commodity: "Rice",
    variety: "Basmati 1121",
    category: "crops",
    modalPrice: 4200,
    minPrice: 3800,
    maxPrice: 4500,
    distance: 200,
  },
  {
    id: "s8",
    market: "Gurugram Mandi",
    state: "Haryana",
    commodity: "Wheat",
    variety: "Lok-1",
    category: "crops",
    modalPrice: 2300,
    minPrice: 2100,
    maxPrice: 2500,
    distance: 28,
  },
  {
    id: "s9",
    market: "Ludhiana Mandi",
    state: "Punjab",
    commodity: "Wheat",
    variety: "PBW 343",
    category: "crops",
    modalPrice: 2350,
    minPrice: 2150,
    maxPrice: 2550,
    distance: 300,
  },
  {
    id: "s10",
    market: "Amritsar Mandi",
    state: "Punjab",
    commodity: "Rice",
    variety: "PR 106",
    category: "crops",
    modalPrice: 1950,
    minPrice: 1800,
    maxPrice: 2100,
    distance: 450,
  },
  {
    id: "s11",
    market: "Indore Mandi",
    state: "Madhya Pradesh",
    commodity: "Soybean",
    variety: "Yellow",
    category: "seeds",
    modalPrice: 4400,
    minPrice: 4200,
    maxPrice: 4700,
    distance: 780,
  },
  {
    id: "s12",
    market: "Bhopal Mandi",
    state: "Madhya Pradesh",
    commodity: "Cotton",
    variety: "Long Staple",
    category: "crops",
    modalPrice: 7200,
    minPrice: 6800,
    maxPrice: 7600,
    distance: 700,
  },
  {
    id: "s13",
    market: "Latur APMC",
    state: "Maharashtra",
    commodity: "Toor Dal",
    variety: "Desi",
    category: "crops",
    modalPrice: 10000,
    minPrice: 9500,
    maxPrice: 10500,
    distance: 1600,
  },
  {
    id: "s14",
    market: "Nasik APMC",
    state: "Maharashtra",
    commodity: "Onion",
    variety: "Nashik Red",
    category: "vegetables",
    modalPrice: 1500,
    minPrice: 1200,
    maxPrice: 1800,
    distance: 1600,
  },
  {
    id: "s15",
    market: "Nagpur APMC",
    state: "Maharashtra",
    commodity: "Orange",
    variety: "Nagpur Mandarin",
    category: "fruits",
    modalPrice: 3500,
    minPrice: 3000,
    maxPrice: 4000,
    distance: 1100,
  },
  {
    id: "s16",
    market: "Pune APMC",
    state: "Maharashtra",
    commodity: "Grape",
    variety: "Thomson Seedless",
    category: "fruits",
    modalPrice: 4500,
    minPrice: 4000,
    maxPrice: 5000,
    distance: 1510,
  },
  {
    id: "s17",
    market: "Ratnagiri Mandi",
    state: "Maharashtra",
    commodity: "Mango",
    variety: "Alphonso",
    category: "fruits",
    modalPrice: 10000,
    minPrice: 8000,
    maxPrice: 12000,
    distance: 1800,
  },
  {
    id: "s18",
    market: "Jaipur Mandi",
    state: "Rajasthan",
    commodity: "Bajra",
    variety: "HHB 67",
    category: "crops",
    modalPrice: 2100,
    minPrice: 1900,
    maxPrice: 2300,
    distance: 280,
  },
  {
    id: "s19",
    market: "Jodhpur Mandi",
    state: "Rajasthan",
    commodity: "Guar Seed",
    variety: "Local",
    category: "seeds",
    modalPrice: 5600,
    minPrice: 5200,
    maxPrice: 6000,
    distance: 600,
  },
  {
    id: "s20",
    market: "Ahmedabad APMC",
    state: "Gujarat",
    commodity: "Groundnut",
    variety: "Bold",
    category: "seeds",
    modalPrice: 6200,
    minPrice: 5800,
    maxPrice: 6600,
    distance: 950,
  },
  {
    id: "s21",
    market: "Rajkot Mandi",
    state: "Gujarat",
    commodity: "Castor Seed",
    variety: "GAU-1",
    category: "seeds",
    modalPrice: 5700,
    minPrice: 5400,
    maxPrice: 6000,
    distance: 1100,
  },
  {
    id: "s22",
    market: "Kolar Mandi",
    state: "Karnataka",
    commodity: "Tomato",
    variety: "Hybrid",
    category: "vegetables",
    modalPrice: 1000,
    minPrice: 800,
    maxPrice: 1200,
    distance: 2150,
  },
  {
    id: "s23",
    market: "Davangere Mandi",
    state: "Karnataka",
    commodity: "Maize",
    variety: "Hybrid",
    category: "crops",
    modalPrice: 1900,
    minPrice: 1700,
    maxPrice: 2100,
    distance: 2300,
  },
  {
    id: "s24",
    market: "Koyambedu Market",
    state: "Tamil Nadu",
    commodity: "Banana",
    variety: "Robusta",
    category: "fruits",
    modalPrice: 2800,
    minPrice: 2400,
    maxPrice: 3200,
    distance: 2200,
  },
  {
    id: "s25",
    market: "Dindigul Mandi",
    state: "Tamil Nadu",
    commodity: "Coconut",
    variety: "Tall",
    category: "fruits",
    modalPrice: 1600,
    minPrice: 1400,
    maxPrice: 1800,
    distance: 2450,
  },
  {
    id: "s26",
    market: "Guntur APMC",
    state: "Andhra Pradesh",
    commodity: "Red Chilli",
    variety: "Byadagi",
    category: "crops",
    modalPrice: 18000,
    minPrice: 16000,
    maxPrice: 20000,
    distance: 1800,
  },
  {
    id: "s27",
    market: "Kurnool Mandi",
    state: "Andhra Pradesh",
    commodity: "Sunflower",
    variety: "DRSH-1",
    category: "seeds",
    modalPrice: 5400,
    minPrice: 5100,
    maxPrice: 5700,
    distance: 1700,
  },
  {
    id: "s28",
    market: "Hyderabad APMC",
    state: "Telangana",
    commodity: "Turmeric",
    variety: "Erode",
    category: "crops",
    modalPrice: 15000,
    minPrice: 13000,
    maxPrice: 17000,
    distance: 1560,
  },
  {
    id: "s29",
    market: "Siliguri Mandi",
    state: "West Bengal",
    commodity: "Ginger",
    variety: "Dry",
    category: "crops",
    modalPrice: 8500,
    minPrice: 7500,
    maxPrice: 9500,
    distance: 1700,
  },
  {
    id: "s30",
    market: "Shimla Mandi",
    state: "Himachal Pradesh",
    commodity: "Apple",
    variety: "Royal Delicious",
    category: "fruits",
    modalPrice: 6000,
    minPrice: 5000,
    maxPrice: 7000,
    distance: 350,
  },
  {
    id: "s31",
    market: "Agra Mandi",
    state: "Uttar Pradesh",
    commodity: "Potato",
    variety: "Kufri Bahar",
    category: "vegetables",
    modalPrice: 750,
    minPrice: 600,
    maxPrice: 900,
    distance: 200,
  },
  {
    id: "s32",
    market: "Lucknow Mandi",
    state: "Uttar Pradesh",
    commodity: "Sugarcane",
    variety: "Co-0238",
    category: "crops",
    modalPrice: 350,
    minPrice: 320,
    maxPrice: 380,
    distance: 550,
  },
  {
    id: "s33",
    market: "Varanasi Mandi",
    state: "Uttar Pradesh",
    commodity: "Mustard",
    variety: "Yellow",
    category: "seeds",
    modalPrice: 5200,
    minPrice: 4900,
    maxPrice: 5500,
    distance: 820,
  },
  {
    id: "s34",
    market: "Muzaffarpur Mandi",
    state: "Bihar",
    commodity: "Litchi",
    variety: "Shahi",
    category: "fruits",
    modalPrice: 8000,
    minPrice: 7000,
    maxPrice: 9000,
    distance: 1100,
  },
  {
    id: "s35",
    market: "Patna Mandi",
    state: "Bihar",
    commodity: "Rice",
    variety: "Sona Masuri",
    category: "crops",
    modalPrice: 2800,
    minPrice: 2600,
    maxPrice: 3000,
    distance: 1000,
  },
  {
    id: "s36",
    market: "Guwahati Mandi",
    state: "Assam",
    commodity: "Tea",
    variety: "CTC",
    category: "crops",
    modalPrice: 11000,
    minPrice: 9500,
    maxPrice: 12500,
    distance: 1950,
  },
  {
    id: "s37",
    market: "Bhubaneswar Mandi",
    state: "Odisha",
    commodity: "Rice",
    variety: "Swarna",
    category: "crops",
    modalPrice: 2200,
    minPrice: 2000,
    maxPrice: 2400,
    distance: 1700,
  },
  {
    id: "s38",
    market: "Kochi Mandi",
    state: "Kerala",
    commodity: "Coconut",
    variety: "West Coast Tall",
    category: "fruits",
    modalPrice: 1800,
    minPrice: 1600,
    maxPrice: 2000,
    distance: 2500,
  },
  {
    id: "s39",
    market: "Calicut Mandi",
    state: "Kerala",
    commodity: "Black Pepper",
    variety: "Panniyur-1",
    category: "crops",
    modalPrice: 55000,
    minPrice: 50000,
    maxPrice: 60000,
    distance: 2450,
  },
  {
    id: "s40",
    market: "Jhansi Mandi",
    state: "Uttar Pradesh",
    commodity: "Moong Dal",
    variety: "PDM 139",
    category: "crops",
    modalPrice: 7500,
    minPrice: 7000,
    maxPrice: 8000,
    distance: 490,
  },
  {
    id: "s41",
    market: "Kanpur Mandi",
    state: "Uttar Pradesh",
    commodity: "Arhar Dal",
    variety: "UPAS 120",
    category: "crops",
    modalPrice: 9000,
    minPrice: 8500,
    maxPrice: 9500,
    distance: 480,
  },
  {
    id: "s42",
    market: "Belgaum Mandi",
    state: "Karnataka",
    commodity: "Jowar",
    variety: "SPH 1827",
    category: "crops",
    modalPrice: 2600,
    minPrice: 2400,
    maxPrice: 2800,
    distance: 1700,
  },
  {
    id: "s43",
    market: "Agro Bazaar Delhi",
    state: "Delhi",
    commodity: "Urea",
    variety: "Neem Coated",
    category: "fertilizers",
    modalPrice: 268,
    minPrice: 268,
    maxPrice: 268,
    distance: 15,
  },
  {
    id: "s44",
    market: "Agro Bazaar Delhi",
    state: "Delhi",
    commodity: "DAP",
    variety: "18:46:00",
    category: "fertilizers",
    modalPrice: 1350,
    minPrice: 1350,
    maxPrice: 1350,
    distance: 15,
  },
  {
    id: "s45",
    market: "Pune APMC",
    state: "Maharashtra",
    commodity: "MOP",
    variety: "Standard",
    category: "fertilizers",
    modalPrice: 950,
    minPrice: 900,
    maxPrice: 1000,
    distance: 1510,
  },
  {
    id: "s46",
    market: "Surat Mandi",
    state: "Gujarat",
    commodity: "Banana",
    variety: "Grand Naine",
    category: "fruits",
    modalPrice: 2200,
    minPrice: 1900,
    maxPrice: 2500,
    distance: 1200,
  },
  {
    id: "s47",
    market: "Ludhiana Mandi",
    state: "Punjab",
    commodity: "Potato",
    variety: "Kufri Jyoti",
    category: "vegetables",
    modalPrice: 1050,
    minPrice: 900,
    maxPrice: 1200,
    distance: 300,
  },
  {
    id: "s48",
    market: "Chandigarh Mandi",
    state: "Punjab",
    commodity: "Cauliflower",
    variety: "Pusa Hybrid",
    category: "vegetables",
    modalPrice: 1300,
    minPrice: 1100,
    maxPrice: 1500,
    distance: 250,
  },
  {
    id: "s49",
    market: "Amravati APMC",
    state: "Maharashtra",
    commodity: "Cotton",
    variety: "BT Cotton",
    category: "crops",
    modalPrice: 7400,
    minPrice: 7000,
    maxPrice: 7800,
    distance: 1200,
  },
  {
    id: "s50",
    market: "Ranchi Mandi",
    state: "Jharkhand",
    commodity: "Maize",
    variety: "Local",
    category: "crops",
    modalPrice: 1700,
    minPrice: 1500,
    maxPrice: 1900,
    distance: 1300,
  },
  {
    id: "s51",
    market: "Raipur Mandi",
    state: "Chhattisgarh",
    commodity: "Rice",
    variety: "Mahamaya",
    category: "crops",
    modalPrice: 2100,
    minPrice: 1900,
    maxPrice: 2300,
    distance: 1100,
  },
  {
    id: "s52",
    market: "Dehradun Mandi",
    state: "Uttarakhand",
    commodity: "Wheat",
    variety: "HP-1633",
    category: "crops",
    modalPrice: 2200,
    minPrice: 2000,
    maxPrice: 2400,
    distance: 300,
  },
  {
    id: "s53",
    market: "Haridwar Mandi",
    state: "Uttarakhand",
    commodity: "Rice",
    variety: "Dehraduni Basmati",
    category: "crops",
    modalPrice: 4800,
    minPrice: 4400,
    maxPrice: 5200,
    distance: 220,
  },
  {
    id: "s54",
    market: "Saharanpur Mandi",
    state: "Uttar Pradesh",
    commodity: "Mango",
    variety: "Dussehri",
    category: "fruits",
    modalPrice: 3000,
    minPrice: 2500,
    maxPrice: 3500,
    distance: 170,
  },
  {
    id: "s55",
    market: "Coimbatore Mandi",
    state: "Tamil Nadu",
    commodity: "Cotton",
    variety: "MCU-5",
    category: "crops",
    modalPrice: 6800,
    minPrice: 6400,
    maxPrice: 7200,
    distance: 2300,
  },
];

function applyStaticMetadata(prices) {
  return prices.map((price) => ({
    ...price,
    id: price.id || makePriceId(price),
    trend: "stable",
    source: "reference",
  }));
}

function normalizeBackendRecord(record, index) {
  const market = record.market || record.Market || "";
  const commodity = record.commodity || record.Commodity || "";
  const id = record.id || makePriceId(record) || `backend_${index}`;

  return {
    ...record,
    id,
    market,
    state: record.state || record.State || "",
    commodity,
    variety: record.variety || record.Variety || "Local",
    category: categorize(commodity),
    modalPrice: Number(record.modalPrice ?? record.Modal_Price) || 0,
    minPrice: Number(record.minPrice ?? record.Min_Price) || 0,
    maxPrice: Number(record.maxPrice ?? record.Max_Price) || 0,
    distance: null,
    trend: record.trend || "stable",
    source: record.source || "live",
  };
}

function writeReferenceCache(records, meta) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      REFERENCE_CACHE_KEY,
      JSON.stringify({
        records,
        meta: {
          ...meta,
          cachedAt: new Date().toISOString(),
        },
      }),
    );
  } catch {
    // Browser storage may be disabled; reference prices still render from memory.
  }
}

function readReferenceCache() {
  if (typeof window === "undefined") return null;

  try {
    const cached = JSON.parse(
      window.localStorage.getItem(REFERENCE_CACHE_KEY) ?? "null",
    );
    return Array.isArray(cached?.records) && cached.records.length ? cached : null;
  } catch {
    return null;
  }
}

function getFriendlyPriceErrorMessage(error) {
  if (error?.name === "TimeoutError" || error?.name === "AbortError") {
    return `AgriConnect took longer than ${Math.round(PRICE_REQUEST_TIMEOUT_MS / 1000)} seconds to fetch live mandi prices. Showing reference prices instead.`;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Live mandi prices are unavailable. Showing curated reference prices.";
}



/**
 * Fetches mandi prices and annotates whether the response is live, stale, or reference data.
 * @returns {Promise<{records: Array, meta: {source: string, label: string, warning: string, fetchedAt: string}}>}
 */
export async function fetchMandiPrices() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/prices`, {
      signal: AbortSignal.timeout(PRICE_REQUEST_TIMEOUT_MS),
    });
    const data = await res.json();

    if (!res.ok || !data.records?.length) {
      throw new Error(data?.meta?.warning || "Live mandi source unavailable.");
    }

    return {
      records: mergePriceRecords(
        data.records.map((record, index) =>
          record.modalPrice !== undefined
            ? normalizeBackendRecord(record, index)
            : normalizeApiRecord(record, index),
        ),
      ),
      meta: {
        source: data.meta?.source ?? "live",
        label: data.meta?.label ?? "Live prices",
        warning: data.meta?.warning ?? "",
        fetchedAt: data.meta?.fetchedAt ?? new Date().toISOString(),
        checkedAt: data.meta?.checkedAt ?? new Date().toISOString(),
        cacheUpdatedAt: data.meta?.cacheUpdatedAt ?? data.meta?.fetchedAt ?? null,
        nextLiveCheckAt: data.meta?.nextLiveCheckAt ?? null,
        stale: Boolean(data.meta?.stale),
      },
    };
  } catch (error) {
    const records = applyStaticMetadata(STATIC_PRICES);
    const meta = {
      source: "reference",
      label: "Reference prices",
      warning: getFriendlyPriceErrorMessage(error),
      fetchedAt: new Date().toISOString(),
      checkedAt: new Date().toISOString(),
      cacheUpdatedAt: new Date().toISOString(),
      nextLiveCheckAt: null,
      stale: false,
    };
    writeReferenceCache(records, meta);
    // Keep the last reviewed reference payload in browser storage so the page
    // can still render meaningful data when both live fetches and static fallback fail.
    const cachedReference = readReferenceCache();

    return {
      records: mergePriceRecords(
        (cachedReference?.records ?? records).map(normalizeBackendRecord),
      ),
      meta: cachedReference?.meta ?? meta,
    };
  }
}

export { STATIC_PRICES };
export const PRICE_CATEGORIES = [
  "all",
  "crops",
  "vegetables",
  "fruits",
  "livestock",
  "seeds",
  "fertilizers",
];
