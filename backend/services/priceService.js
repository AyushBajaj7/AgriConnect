const { dataPath, readJson, writeJson } = require("./localStore");

const CACHE_FILE = dataPath("prices", "latest-live.json");
const REFERENCE_CACHE_FILE = dataPath("prices", "reference-prices.json");
const STATUS_FILE = dataPath("system", "status.json");

function readHours(name, fallback) {
  const parsed = Number.parseInt(process.env[name] ?? String(fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readMinutes(name, fallback) {
  const parsed = Number.parseInt(process.env[name] ?? String(fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readCount(name, fallback) {
  const parsed = Number.parseInt(process.env[name] ?? String(fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatSeconds(milliseconds) {
  return Math.round(milliseconds / 1000);
}

function addMilliseconds(value, milliseconds) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time + milliseconds).toISOString() : null;
}

const PRICE_CACHE_MAX_AGE_MS = readHours("PRICE_CACHE_MAX_AGE_HOURS", 12) * 60 * 60 * 1000;
const LOGIN_REFRESH_INTERVAL_MS =
  readHours("PRICE_LOGIN_REFRESH_HOURS", 24) * 60 * 60 * 1000;
const LIVE_REFRESH_INTERVAL_MS =
  readMinutes("PRICE_LIVE_REFRESH_MINUTES", 10) * 60 * 1000;
const DEFAULT_AGMARKNET_URL =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
const AGMARKNET_URL = process.env.AGMARKNET_URL?.trim() || DEFAULT_AGMARKNET_URL;
const LIVE_BATCH_LIMIT = readCount("PRICE_LIVE_FETCH_LIMIT", 1000);
const LIVE_BATCH_PAGES = readCount("PRICE_LIVE_FETCH_PAGES", 5);
const LIVE_SOURCE_TIMEOUT_MS = readCount("PRICE_LIVE_UPSTREAM_TIMEOUT_MS", 30000);

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

function hasCategoryKeyword(normalizedCommodity, keywords) {
  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeCategoryText(keyword);
    return new RegExp(`(^| )${escapeRegExp(normalizedKeyword)}( |$)`).test(
      normalizedCommodity,
    );
  });
}

function categorize(commodity = "") {
  const normalized = normalizeCategoryText(commodity);
  if (
    hasCategoryKeyword(normalized, [
      "onion",
      "potato",
      "tomato",
      "cabbage",
      "brinjal",
      "eggplant",
      "pea",
      "garlic",
      "carrot",
      "cauliflower",
      "capsicum",
      "cucumber",
      "pumpkin",
      "gourd",
      "snakeguard",
      "snake gourd",
      "snake guard",
      "parval",
      "bhindi",
      "okra",
      "bean",
      "chilli",
      "chili",
      "spinach",
      "coriander",
      "radish",
      "turnip",
      "beetroot",
    ])
  ) {
    return "vegetables";
  }
  if (
    hasCategoryKeyword(normalized, [
      "mango",
      "banana",
      "apple",
      "grape",
      "orange",
      "coconut",
      "papaya",
      "litchi",
      "lychee",
      "guava",
      "pineapple",
      "watermelon",
      "muskmelon",
      "lemon",
      "lime",
      "jackfruit",
      "pomegranate",
    ])
  ) {
    return "fruits";
  }
  if (
    hasCategoryKeyword(normalized, [
      "seed",
      "groundnut",
      "sunflower",
      "castor",
      "sesame",
      "soybean",
      "mustard",
    ])
  ) {
    return "seeds";
  }
  if (
    hasCategoryKeyword(normalized, [
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
    ])
  ) {
    return "fertilizers";
  }
  return "crops";
}

function makePriceId(record, index) {
  return [
    record.State ?? record.state,
    record.Market ?? record.market,
    record.Commodity ?? record.commodity,
    record.Variety ?? record.variety ?? "local",
    index,
  ]
    .join("_")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseNumber(value) {
  const parsed = Number.parseInt(String(value ?? "").replace(/,/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeApiRecord(record, index) {
  const market = record.Market ?? record.market ?? "Unknown market";
  const commodity = record.Commodity ?? record.commodity ?? "Unknown crop";

  return {
    id: makePriceId(record, index),
    market,
    state: record.State ?? record.state ?? "Unknown state",
    commodity,
    variety: record.Variety ?? record.variety ?? "Local",
    category: categorize(commodity),
    modalPrice: parseNumber(record.Modal_Price ?? record.modal_price),
    minPrice: parseNumber(record.Min_Price ?? record.min_price),
    maxPrice: parseNumber(record.Max_Price ?? record.max_price),
    trend: "stable",
    source: "live",
  };
}

function makeGroupingKey(record) {
  return [record.state, record.market, record.commodity, record.variety]
    .join("|")
    .toLowerCase();
}

function mergeDuplicateRecords(records) {
  const grouped = new Map();

  for (const record of records) {
    const key = makeGroupingKey(record);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        ...record,
        recordCount: 1,
      });
      continue;
    }

    const totalCount = existing.recordCount + 1;
    grouped.set(key, {
      ...existing,
      minPrice: Math.min(existing.minPrice, record.minPrice),
      maxPrice: Math.max(existing.maxPrice, record.maxPrice),
      modalPrice: Math.round(
        (existing.modalPrice * existing.recordCount + record.modalPrice) / totalCount,
      ),
      recordCount: totalCount,
    });
  }

  return Array.from(grouped.values())
    .map(({ recordCount, ...record }) => record)
    .sort((left, right) => {
      const commoditySort = left.commodity.localeCompare(right.commodity);
      if (commoditySort !== 0) {
        return commoditySort;
      }

      const stateSort = left.state.localeCompare(right.state);
      if (stateSort !== 0) {
        return stateSort;
      }

      return left.market.localeCompare(right.market);
    });
}

async function fetchBatch(apiKey, offset) {
  const url =
    `${AGMARKNET_URL}?api-key=${encodeURIComponent(apiKey)}` +
    `&format=json&limit=${LIVE_BATCH_LIMIT}&offset=${offset}`;
  let response;

  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(LIVE_SOURCE_TIMEOUT_MS),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new Error(
        `The official mandi source did not respond within ${formatSeconds(LIVE_SOURCE_TIMEOUT_MS)} seconds.`,
      );
    }

    throw error;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = new Error(`Mandi source returned ${response.status}. ${body}`);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  return Array.isArray(payload.records) ? payload.records : [];
}

function readSystemStatus() {
  return readJson(STATUS_FILE, {
    prices: {
      state: "unknown",
      message: "No price sync has run yet.",
      lastSuccessAt: null,
      lastAttemptAt: null,
    },
  });
}

function writePriceStatus(status) {
  const current = readSystemStatus();
  writeJson(STATUS_FILE, {
    ...current,
    prices: {
      ...current.prices,
      ...status,
    },
  });
}

function readPriceCache() {
  return readJson(CACHE_FILE, null);
}

function readReferenceCache() {
  return readJson(REFERENCE_CACHE_FILE, null);
}

function writeReferenceCacheFromLive(liveResult) {
  const now = new Date().toISOString();
  const referenceResult = {
    records: liveResult.records.map((record) => ({
      ...record,
      source: "live-derived-reference",
      trend: "stable",
    })),
    meta: {
      source: "reference",
      label: "Reference prices",
      warning:
        "Live mandi prices are currently unavailable. Showing reference prices saved from the last successful live update.",
      fetchedAt: liveResult.meta.fetchedAt,
      referenceUpdatedAt: now,
      stale: false,
    },
  };

  writeJson(REFERENCE_CACHE_FILE, referenceResult);
  return referenceResult;
}

function getCacheAge(cache) {
  if (!cache?.meta?.fetchedAt) {
    return Number.POSITIVE_INFINITY;
  }
  return Date.now() - new Date(cache.meta.fetchedAt).getTime();
}

function getNewestCacheAge() {
  const liveCache = readPriceCache();
  const referenceCache = readReferenceCache();
  return Math.min(getCacheAge(liveCache), getCacheAge(referenceCache));
}

async function fetchLivePrices() {
  const apiKey = process.env.AGMARKNET_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("AGMARKNET_API_KEY is not configured");
  }

  const batches = [];

  for (let pageIndex = 0; pageIndex < LIVE_BATCH_PAGES; pageIndex += 1) {
    const batch = await fetchBatch(apiKey, pageIndex * LIVE_BATCH_LIMIT);
    if (!batch.length) {
      break;
    }

    batches.push(...batch);

    if (batch.length < LIVE_BATCH_LIMIT) {
      break;
    }
  }

  const normalized = batches.map(normalizeApiRecord).filter((item) => {
    return item.market && item.commodity && item.modalPrice > 0;
  });
  const merged = mergeDuplicateRecords(normalized);

  if (!merged.length) {
    throw new Error("Mandi source returned no usable records.");
  }

  const result = {
    records: merged,
    meta: {
      source: "live",
      label: "Live prices",
      warning: "",
      fetchedAt: new Date().toISOString(),
      checkedAt: null,
      cacheUpdatedAt: null,
      nextLiveCheckAt: null,
      stale: false,
      uniqueRecords: merged.length,
    },
  };

  result.meta.checkedAt = result.meta.fetchedAt;
  result.meta.cacheUpdatedAt = result.meta.fetchedAt;
  result.meta.nextLiveCheckAt = addMilliseconds(
    result.meta.fetchedAt,
    LIVE_REFRESH_INTERVAL_MS,
  );

  writeJson(CACHE_FILE, result);
  writeReferenceCacheFromLive(result);
  writePriceStatus({
    state: "live",
    message: "Live mandi prices fetched successfully.",
    lastSuccessAt: result.meta.fetchedAt,
    lastAttemptAt: result.meta.fetchedAt,
  });
  return result;
}

async function refreshPricesIfStale(maxAgeMs = LOGIN_REFRESH_INTERVAL_MS) {
  if (getNewestCacheAge() < maxAgeMs) {
    return getPriceStatus();
  }

  try {
    return await fetchLivePrices();
  } catch (error) {
    writePriceStatus({
      state: readPriceCache()?.records?.length ? "stale" : "unavailable",
      message: error.message,
      lastAttemptAt: new Date().toISOString(),
    });
    return getPriceStatus();
  }
}

async function getMandiPrices() {
  const attemptedAt = new Date().toISOString();
  const cache = readPriceCache();

  if (cache?.records?.length && getCacheAge(cache) < LIVE_REFRESH_INTERVAL_MS) {
    const cachedAt = cache.meta?.fetchedAt ?? null;
    const nextLiveCheckAt = addMilliseconds(cachedAt, LIVE_REFRESH_INTERVAL_MS);
    if (!readReferenceCache()?.records?.length) {
      writeReferenceCacheFromLive(cache);
    }

    writePriceStatus({
      state: "cached",
      message: "Using saved live mandi prices until the next 10-minute refresh window.",
      lastSuccessAt: cachedAt,
      lastAttemptAt: attemptedAt,
    });

    return {
      ...cache,
      meta: {
        ...cache.meta,
        source: "cached",
        label: "Saved live prices",
        checkedAt: attemptedAt,
        cacheUpdatedAt: cachedAt,
        nextLiveCheckAt,
        warning:
          "These prices came from the last successful live mandi update. AgriConnect checks the live source at most once every 10 minutes to reduce load and avoid API rate limits.",
        stale: false,
      },
    };
  }

  try {
    return await fetchLivePrices();
  } catch (error) {
    writePriceStatus({
      state: cache ? "stale" : "unavailable",
      message: error.message,
      lastAttemptAt: attemptedAt,
    });

    if (cache?.records?.length) {
      const stale = getCacheAge(cache) > PRICE_CACHE_MAX_AGE_MS;
      return {
        ...cache,
        meta: {
          ...cache.meta,
          source: stale ? "stale" : "cached",
          label: stale ? "Stale live prices" : "Last live prices",
          checkedAt: attemptedAt,
          cacheUpdatedAt: cache.meta?.fetchedAt ?? null,
          nextLiveCheckAt: addMilliseconds(
            cache.meta?.fetchedAt,
            LIVE_REFRESH_INTERVAL_MS,
          ),
          warning:
            "The live mandi source is unavailable. Showing the last successful live update.",
          stale,
          failedAt: attemptedAt,
        },
      };
    }

    const referenceCache = readReferenceCache();
    if (referenceCache?.records?.length) {
      return {
        ...referenceCache,
        meta: {
          ...referenceCache.meta,
          source: "reference",
          label: "Reference prices",
          warning:
            referenceCache.meta?.warning ||
            "Live mandi prices are unavailable. Showing saved reference prices.",
          checkedAt: attemptedAt,
          cacheUpdatedAt:
            referenceCache.meta?.referenceUpdatedAt ??
            referenceCache.meta?.fetchedAt ??
            null,
          failedAt: attemptedAt,
        },
      };
    }

    const fallbackError = new Error(error.message);
    fallbackError.code = "NO_PRICE_CACHE";
    throw fallbackError;
  }
}

function getPriceStatus() {
  return readSystemStatus().prices;
}

module.exports = {
  getMandiPrices,
  getPriceStatus,
  refreshPricesIfStale,
};
