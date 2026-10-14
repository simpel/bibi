import type { Db } from "../client";
import type { Prisma } from "../generated/prisma/client";
import { getDb } from "../get-db";
import { createPurger } from "./purge-system-log";
import { toSystemLogRow } from "./to-system-log-row";

export type SystemLogSink = {
  /** pino destination contract: one JSON line per call. Never throws, never blocks on I/O. */
  write: (line: string) => void;
  /** Writes buffered rows now (tests, shutdown). */
  flush: () => Promise<void>;
};

export type CreateSystemLogSinkInput = {
  retentionDays: number;
  db?: Db;
  flushIntervalMs?: number;
  maxBatch?: number;
  /** Oldest lines are dropped beyond this (DB down): memory stays bounded. */
  maxBuffer?: number;
};

// The sink cannot log through the logger (it would feed itself): failures go to stderr.
const report = ({ message, error }: { message: string; error: unknown }) => {
  const detail = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[system-log-sink] ${message}: ${detail}\n`);
};

/**
 * Persists log lines to `SystemLog` for the admin view (ADR 0015): buffered, batched
 * `createMany`, and an hourly purge of rows older than `retentionDays`.
 */
export function createSystemLogSink({
  retentionDays,
  db,
  flushIntervalMs = 2000,
  maxBatch = 200,
  maxBuffer = 5000,
}: CreateSystemLogSinkInput): SystemLogSink {
  const client = () => db ?? getDb();
  const purge = createPurger({ client, retentionDays });
  const buffer: Prisma.SystemLogCreateManyInput[] = [];
  let flushing: Promise<void> = Promise.resolve();
  const drain = async () => {
    while (buffer.length > 0) {
      await client().systemLog.createMany({ data: buffer.splice(0, maxBatch) });
    }
    await purge();
  };
  const flush = () => {
    flushing = flushing
      .then(drain)
      .catch((error: unknown) => report({ message: "flush failed", error }));
    return flushing;
  };
  setInterval(() => void flush(), flushIntervalMs).unref();
  return {
    write: (line: string) => {
      try {
        buffer.push(toSystemLogRow({ entry: JSON.parse(line) as Record<string, unknown> }));
        if (buffer.length > maxBuffer) buffer.splice(0, buffer.length - maxBuffer);
        if (buffer.length >= maxBatch) void flush();
      } catch (error) {
        report({ message: "unparseable log line", error });
      }
    },
    flush,
  };
}
