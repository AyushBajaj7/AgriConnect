const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

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
