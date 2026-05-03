type LogContext = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN = /password|token|secret|authorization|cookie/i;

function shouldLog() {
  return process.env.NODE_ENV !== "test";
}

function sanitizeValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key) && typeof value !== "boolean") {
    return "[redacted]";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(key, item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeValue(entryKey, entryValue),
      ]),
    );
  }

  return value;
}

function sanitizeContext(context: LogContext = {}) {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, sanitizeValue(key, value)]),
  );
}

function writeLog(level: "info" | "warn" | "error", message: string, context?: LogContext) {
  if (!shouldLog()) {
    return;
  }

  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitizeContext(context),
  };

  if (level === "error") {
    console.error(payload);
    return;
  }

  console.log(payload);
}

export function logInfo(message: string, context?: LogContext) {
  writeLog("info", message, context);
}

export function logWarn(message: string, context?: LogContext) {
  writeLog("warn", message, context);
}

export function logError(message: string, context?: LogContext) {
  writeLog("error", message, context);
}
