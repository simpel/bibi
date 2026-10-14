import { getEnv } from "@okazi/config";
import { type DestinationStream, pino } from "pino";
import { PinoPretty } from "pino-pretty";
import { createLogger } from "./create-logger";
import type { Logger, LogLevel } from "./types";

export type InitLoggerInput = {
  /** Process name on every line, e.g. `web`, `mcp`. */
  service: string;
  /** `stderr` when stdout carries a protocol (stdio MCP server). Default `stdout`. */
  stream?: "stdout" | "stderr";
  /** Extra JSON-line destinations at info and above, e.g. the `SystemLog` table (ADR 0015). */
  sinks?: readonly DestinationStream[];
};

type State = { settings: InitLoggerInput; root?: Logger | undefined };

const KEY = Symbol.for("okazi.logger.root");

// Shared per process, even if bundlers load this module more than once (Next route bundles).
const holder = globalThis as typeof globalThis & { [KEY]?: State };
holder[KEY] ??= { settings: { service: "okazi" } };
const state = holder[KEY];

function defaultLevel(): LogLevel {
  const env = getEnv();
  return env.LOG_LEVEL ?? (env.NODE_ENV === "test" ? "silent" : "info");
}

// Synchronous writes: the last lines before a crash must not be lost.
function consoleStream(): DestinationStream {
  const env = getEnv();
  const fd = state.settings.stream === "stderr" ? 2 : 1;
  const format = env.LOG_FORMAT ?? (env.NODE_ENV === "production" ? "json" : "pretty");
  if (format === "json") return pino.destination({ dest: fd, sync: true });
  return PinoPretty({ destination: fd, sync: true, translateTime: "SYS:HH:MM:ss.l" });
}

function destination({ level }: { level: LogLevel }): DestinationStream {
  const sinks = state.settings.sinks ?? [];
  if (sinks.length === 0 || level === "silent") return consoleStream();
  return pino.multistream([
    { level, stream: consoleStream() },
    ...sinks.map((stream) => ({ level: "info" as const, stream })),
  ]);
}

/** Call once at process start (app entry points) before anything logs. */
export function initLogger({ service, stream, sinks }: InitLoggerInput): void {
  state.settings = { service, ...(stream ? { stream } : {}), ...(sinks ? { sinks } : {}) };
  state.root = undefined;
}

/** The process logger. Every log line in the app goes through this (ADR 0014). */
export function getLogger(): Logger {
  const level = defaultLevel();
  state.root ??= createLogger({
    level,
    service: state.settings.service,
    destination: destination({ level }),
  });
  return state.root;
}

export type SetLoggerInput = { logger: Logger | undefined };

/** Test seam: replace the process logger (`undefined` restores the env-configured one). */
export function setLogger({ logger }: SetLoggerInput): void {
  state.root = logger;
}

/** The current logger without creating one (for capture/restore in tests). */
export function peekLogger(): Logger | undefined {
  return state.root;
}
