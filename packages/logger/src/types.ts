/**
 * Where a request entered the system (ADR 0014). `system` = no request (jobs, startup);
 * `webhook` = a provider calling us (e.g. Resend's inbound mail webhook).
 */
export const SURFACES = [
  "web",
  "graphql",
  "rest",
  "mcp",
  "ai",
  "auth",
  "cli",
  "system",
  "webhook",
] as const;

export type Surface = (typeof SURFACES)[number];

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "silent";

/**
 * One structured log event. `event` is a stable `<area>.<happening>` name (e.g.
 * `operation.completed`) that queries filter on; `msg` defaults to it. `err` gets the error
 * serializer (stack + cause chain). Never put request/response payloads here.
 */
export type LogFields = { event: string; msg?: string; err?: unknown } & Record<string, unknown>;

export type LogMethod = (fields: LogFields) => void;

export type ChildInput = { bindings: Record<string, unknown> };

export type Logger = {
  trace: LogMethod;
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  fatal: LogMethod;
  /** Logger whose every line carries `bindings` (e.g. `{ component: "mail" }`). */
  child: (input: ChildInput) => Logger;
};
