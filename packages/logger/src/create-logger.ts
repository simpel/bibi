import { type DestinationStream, type Logger as PinoLogger, pino } from "pino";
import { getLogContext } from "./log-context";
import { REDACT_PATHS } from "./redact-paths";
import type { LogFields, Logger, LogLevel } from "./types";

export type CreateLoggerInput = {
  level: LogLevel;
  service: string;
  /** Default: stdout. Tests pass an in-memory stream; the stdio MCP server passes stderr. */
  destination?: DestinationStream;
};

type Level = Exclude<LogLevel, "silent">;

type WrapInput = { base: PinoLogger };

/** Object-first API over pino: `log.info({ event, ...fields })`. */
function wrap({ base }: WrapInput): Logger {
  const method =
    ({ level }: { level: Level }) =>
    ({ msg, ...fields }: LogFields) =>
      base[level](fields, msg ?? fields.event);
  return {
    trace: method({ level: "trace" }),
    debug: method({ level: "debug" }),
    info: method({ level: "info" }),
    warn: method({ level: "warn" }),
    error: method({ level: "error" }),
    fatal: method({ level: "fatal" }),
    child: ({ bindings }) => wrap({ base: base.child(bindings) }),
  };
}

/** JSON lines with ISO time, level label, request context, redaction and error serialization. */
export function createLogger({ level, service, destination }: CreateLoggerInput): Logger {
  const options = {
    level,
    base: { service },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label: string) => ({ level: label }) },
    serializers: { err: pino.stdSerializers.errWithCause },
    redact: { paths: [...REDACT_PATHS], censor: "[redacted]" },
    mixin: () => ({ ...getLogContext() }),
  };
  return wrap({ base: destination ? pino(options, destination) : pino(options) });
}
