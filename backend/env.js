import { readFileSync } from "node:fs";

const DEFAULTS = {
  PORT: "4000",
  APP_ENV: "development",
  CORS_ORIGIN: "http://localhost:3000"
};

function parseEnvFile(content) {
  const entries = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    entries[key] = value;
  }

  return entries;
}

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, "utf8");
    return parseEnvFile(content);
  } catch {
    return {};
  }
}

export function loadBackendEnv() {
  const fileEnv = loadEnvFile(new URL("./.env", import.meta.url));
  const source = { ...DEFAULTS, ...fileEnv, ...process.env };

  const port = Number(source.PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  if (!source.CORS_ORIGIN) {
    throw new Error("CORS_ORIGIN is required");
  }

  return {
    port,
    appEnv: source.APP_ENV,
    corsOrigin: source.CORS_ORIGIN
  };
}
