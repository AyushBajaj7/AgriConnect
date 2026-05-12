const { dataPath, readJson, writeJson } = require("./localStore");

const REVIEW_LOG_FILE = dataPath("schemes", "review-log.json");
const REVIEW_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const SCHEME_SOURCES = [
  {
    id: "myscheme",
    name: "myScheme government portal",
    url: "https://www.myscheme.gov.in/",
  },
  {
    id: "pmkisan",
    name: "PM-KISAN portal",
    url: "https://pmkisan.gov.in/",
  },
  {
    id: "pmfby",
    name: "PMFBY crop insurance portal",
    url: "https://pmfby.gov.in/",
  },
  {
    id: "enam",
    name: "National Agriculture Market portal",
    url: "https://www.enam.gov.in/",
  },
];

function readReviewLog() {
  return readJson(REVIEW_LOG_FILE, {
    lastRunAt: null,
    sources: [],
    notes: [],
  });
}

function isReviewLogFresh(log) {
  if (!log?.lastRunAt) return false;
  return Date.now() - new Date(log.lastRunAt).getTime() < REVIEW_REFRESH_INTERVAL_MS;
}

async function checkUrl(source) {
  try {
    const response = await fetch(source.url, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });

    return {
      ...source,
      ok: response.ok,
      status: response.status,
      checkedAt: new Date().toISOString(),
      message: response.ok
        ? "Official source is reachable."
        : `Official source returned ${response.status}.`,
    };
  } catch (error) {
    return {
      ...source,
      ok: false,
      status: null,
      checkedAt: new Date().toISOString(),
      message: error.message,
    };
  }
}

async function runSchemeSourceCheck() {
  const checked = await Promise.all(SCHEME_SOURCES.map(checkUrl));
  const log = {
    lastRunAt: new Date().toISOString(),
    sources: checked,
    notes: checked
      .filter((source) => !source.ok)
      .map((source) => ({
        sourceId: source.id,
        message: `${source.name} needs review: ${source.message}`,
      })),
  };
  writeJson(REVIEW_LOG_FILE, log);
  return log;
}

module.exports = {
  isReviewLogFresh,
  readReviewLog,
  runSchemeSourceCheck,
};
