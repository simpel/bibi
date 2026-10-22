import { AsyncLocalStorage } from "node:async_hooks";
import type { Surface } from "./types";

/** Fields every log line inside one request carries automatically (via the pino mixin). */
export type LogContext = {
  requestId?: string;
  surface?: Surface;
  organizationId?: string;
  userId?: string | null;
  actorType?: string;
  conversationId?: string;
};

const KEY = Symbol.for("bibi.logger.context");

// One store per process, even if bundlers load this module more than once (Next route bundles).
const holder = globalThis as typeof globalThis & { [KEY]?: AsyncLocalStorage<LogContext> };
holder[KEY] ??= new AsyncLocalStorage<LogContext>();
const storage = holder[KEY];

export type RunWithLogContextInput<T> = { context: LogContext; fn: () => T };

/** Runs `fn` with `context` merged over the surrounding one (inner wins). */
export function runWithLogContext<T>({ context, fn }: RunWithLogContextInput<T>): T {
  return storage.run({ ...storage.getStore(), ...context }, fn);
}

export function getLogContext(): LogContext | undefined {
  return storage.getStore();
}

export type AddToLogContextInput = { fields: LogContext };

/** Enriches the current request context, e.g. with the caller once authentication resolved. */
export function addToLogContext({ fields }: AddToLogContextInput): void {
  const store = storage.getStore();
  if (store) Object.assign(store, fields);
}
