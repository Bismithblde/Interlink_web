const crypto = require("node:crypto");

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, off: 100 };
const REDACTED = "[REDACTED]";
const SENSITIVE_KEY = /^(?:authorization|cookie|password|secret|accessToken|refreshToken|apiKey|email|instagram|bio|description|profile|profileSnapshot|prompt|responseText)$/i;

const configuredLevel = () => {
  const value = `${process.env.MATCHMAKING_LOG_LEVEL || "info"}`.toLowerCase();
  return Object.hasOwn(LEVELS, value) ? value : "info";
};

const sanitizeValue = (value, key = "", seen = new WeakSet()) => {
  if (SENSITIVE_KEY.test(key)) return REDACTED;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      ...(value.status ? { status: value.status } : {}),
    };
  }
  if (typeof value === "string") return value.length > 500 ? `${value.slice(0, 500)}...[truncated]` : value;
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeValue(item, key, seen));
  return Object.fromEntries(
    Object.entries(value).map(([childKey, childValue]) => [childKey, sanitizeValue(childValue, childKey, seen)])
  );
};

const defaultSink = (record) => {
  const line = JSON.stringify(record);
  if (record.level === "error") console.error(line);
  else if (record.level === "warn") console.warn(line);
  else console.log(line);
};

const createRequestId = () => crypto.randomUUID();

const createMatchmakingLogger = ({ requestId = createRequestId(), operation = "matching", sink = defaultSink } = {}) => {
  const threshold = LEVELS[configuredLevel()];
  const emit = (level, event, details = {}) => {
    if (LEVELS[level] < threshold) return;
    sink({
      timestamp: new Date().toISOString(),
      level,
      service: "matchmaking",
      operation,
      requestId,
      event,
      ...sanitizeValue(details),
    });
  };

  return {
    requestId,
    enabled: (level) => LEVELS[level] >= threshold,
    debug: (event, details) => emit("debug", event, details),
    info: (event, details) => emit("info", event, details),
    warn: (event, details) => emit("warn", event, details),
    error: (event, details) => emit("error", event, details),
    timer: (event, baseDetails = {}) => {
      const startedAt = process.hrtime.bigint();
      return (details = {}, level = "info") => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        emit(level, event, { ...baseDetails, ...details, durationMs: Number(durationMs.toFixed(2)) });
      };
    },
  };
};

module.exports = { createMatchmakingLogger, createRequestId, sanitizeValue };
