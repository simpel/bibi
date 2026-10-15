import type { DestinationStream } from "pino";

export type BetterStackSinkInput = {
  /** Ingesting host from the Better Stack source, e.g. `s1234.eu-nbg-2.betterstackdata.com`. */
  host: string;
  /** Source token. */
  token: string;
  /** Flush after this many ms. Default 2000. */
  flushIntervalMs?: number;
  /** Flush when this many lines are buffered. Default 100. */
  maxBatch?: number;
  /** Test seam. Default global `fetch`. */
  fetchImpl?: typeof fetch;
};

export type BetterStackSink = DestinationStream & { flush: () => Promise<void> };

function toEvent({ line }: { line: string }): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(line) as Record<string, unknown>;
    const { time, ...rest } = parsed;
    const dt = typeof time === "number" ? new Date(time).toISOString() : new Date().toISOString();
    return { dt, ...rest };
  } catch {
    return undefined;
  }
}

type PostInput = Required<Pick<BetterStackSinkInput, "host" | "token" | "fetchImpl">> & {
  lines: string[];
};

async function post({ host, token, fetchImpl, lines }: PostInput): Promise<void> {
  const events = lines.map((line) => toEvent({ line })).filter((event) => event !== undefined);
  if (events.length === 0) return;
  try {
    await fetchImpl(`https://${host}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(events),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Dropped on purpose: logging must never take the app down.
  }
}

/**
 * Ships pino JSON lines to Better Stack over HTTP in batches (ADR 0031). Delivery is best effort:
 * a failed batch is dropped (stdout stays the source of truth) and never throws into the app.
 */
export function createBetterStackSink({
  host,
  token,
  flushIntervalMs = 2000,
  maxBatch = 100,
  fetchImpl = fetch,
}: BetterStackSinkInput): BetterStackSink {
  let buffer: string[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function flush(): Promise<void> {
    if (timer) clearTimeout(timer);
    timer = undefined;
    const lines = buffer;
    buffer = [];
    await post({ host, token, fetchImpl, lines });
  }

  process.once("beforeExit", () => void flush());
  return {
    flush,
    write: (line: string) => {
      buffer.push(line);
      if (buffer.length >= maxBatch) {
        void flush();
        return;
      }
      timer ??= setTimeout(() => void flush(), flushIntervalMs);
      timer.unref();
    },
  };
}
