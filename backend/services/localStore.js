const fs = require("fs");
const os = require("os");
const path = require("path");

// Vercel Functions can only write reliably inside the temporary directory.
const DATA_DIR =
  process.env.DATA_DIR ||
  (process.env.VERCEL
    ? path.join(os.tmpdir(), "agriconnect-data")
    : path.join(__dirname, "..", "data"));

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    const corruptPath = `${filePath}.corrupt-${Date.now()}`;
    try {
      fs.renameSync(filePath, corruptPath);
    } catch {
      // Keep the original failure as the useful error signal.
    }
    console.error(`Failed to read ${filePath}. Recreated with defaults.`, error);
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function ensureJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    writeJson(filePath, fallback);
    return fallback;
  }

  return readJson(filePath, fallback);
}

function dataPath(...segments) {
  return path.join(DATA_DIR, ...segments);
}

module.exports = {
  DATA_DIR,
  dataPath,
  ensureJson,
  readJson,
  writeJson,
};
