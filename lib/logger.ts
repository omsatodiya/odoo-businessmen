type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, string | number | boolean | null | undefined>;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_SERVICE = "odoo-template";

function configuredLevel(): LogLevel {
  const level = process.env.LOG_LEVEL;
  return level === "debug" || level === "warn" || level === "error" ? level : "info";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel()];
}

function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
    };
  }

  return { errorMessage: "Unknown error" };
}

async function pushToLoki(level: LogLevel, message: string, context: LogContext) {
  const pushUrl = process.env.LOKI_PUSH_URL;
  if (!pushUrl) return;

  const now = `${Date.now() * 1_000_000}`;
  const payload = {
    streams: [
      {
        stream: {
          service: DEFAULT_SERVICE,
          level,
        },
        values: [[now, JSON.stringify({ message, ...context })]],
      },
    ],
  };

  try {
    await fetch(pushUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    // Logging must never break request handling.
  }
}

function writeConsole(level: LogLevel, message: string, context: LogContext) {
  const payload = { level, message, service: DEFAULT_SERVICE, ...context };
  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

export const logger = {
  debug(message: string, context: LogContext = {}) {
    if (!shouldLog("debug")) return;
    writeConsole("debug", message, context);
    void pushToLoki("debug", message, context);
  },
  info(message: string, context: LogContext = {}) {
    if (!shouldLog("info")) return;
    writeConsole("info", message, context);
    void pushToLoki("info", message, context);
  },
  warn(message: string, context: LogContext = {}) {
    if (!shouldLog("warn")) return;
    writeConsole("warn", message, context);
    void pushToLoki("warn", message, context);
  },
  error(message: string, error?: unknown, context: LogContext = {}) {
    if (!shouldLog("error")) return;
    const errorContext = error === undefined ? {} : serializeError(error);
    writeConsole("error", message, { ...context, ...errorContext });
    void pushToLoki("error", message, { ...context, ...errorContext });
  },
};
