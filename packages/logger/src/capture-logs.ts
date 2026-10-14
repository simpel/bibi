import { createLogger } from "./create-logger";
import { peekLogger, setLogger } from "./root-logger";
import type { Logger } from "./types";

/** One parsed log line (JSON) as written by the logger. */
export type LogEntry = Record<string, unknown> & { level: string; event?: string; msg?: string };

export type MemoryLogger = { logger: Logger; entries: () => LogEntry[] };

/** A logger writing JSON lines to memory, at `trace` level. */
export function createMemoryLogger(): MemoryLogger {
  const lines: string[] = [];
  const destination = { write: (line: string) => void lines.push(line) };
  const logger = createLogger({ level: "trace", service: "test", destination });
  return { logger, entries: () => lines.map((line) => JSON.parse(line) as LogEntry) };
}

export type CapturedLogs = MemoryLogger & {
  /** Entries with this `event`. */
  events: (input: { event: string }) => LogEntry[];
  restore: () => void;
};

/** Test helper: routes the process logger into memory until `restore()`. */
export function captureLogs(): CapturedLogs {
  const previous = peekLogger();
  const memory = createMemoryLogger();
  setLogger({ logger: memory.logger });
  return {
    ...memory,
    events: ({ event }) => memory.entries().filter((entry) => entry.event === event),
    restore: () => setLogger({ logger: previous }),
  };
}
