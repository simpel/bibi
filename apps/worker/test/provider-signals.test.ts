import {
  AppError,
  createMemoryProvider,
  err,
  ok,
  resetProviderAdapters,
  setProviderAdapter,
} from "@bibi/core";
import { getDb } from "@bibi/db";
import { afterEach, describe, expect, it } from "vitest";
import { JOBS } from "../src/jobs";
import { providerPollJob } from "../src/jobs/provider-poll";
import { startProviderStreams } from "../src/provider-streams";

const db = getDb();

afterEach(() => {
  resetProviderAdapters();
});

const outcome = { organizations: 0, synced: 0 };

describe("provider signals in the worker (ADR 0100)", () => {
  it("polls every provider with a poll port, also after another's poll fails", async () => {
    const polled: string[] = [];
    const failing = createMemoryProvider({
      key: "FORTNOX",
      connectKind: "OAUTH",
      signals: {
        poll: {
          intervalMs: 60_000,
          run: async () => {
            polled.push("first");
            return err({ error: new AppError({ code: "UNAVAILABLE", message: "down" }) });
          },
        },
      },
    });
    const working = createMemoryProvider({
      key: "VISMA",
      connectKind: "OAUTH",
      signals: {
        poll: {
          intervalMs: 60_000,
          run: async () => {
            polled.push("second");
            return ok({ value: outcome });
          },
        },
      },
    });
    setProviderAdapter({ key: "FORTNOX", adapter: failing.adapter });
    setProviderAdapter({ key: "VISMA", adapter: working.adapter });
    await providerPollJob.handler({ db });
    expect(polled).toEqual(["first", "second"]);
    expect(JOBS).toContain(providerPollJob);
  });

  it("catches up and starts each configured stream, and returns handles that stop them", async () => {
    const events: string[] = [];
    const stream = createMemoryProvider({
      key: "FORTNOX",
      connectKind: "OAUTH",
      signals: {
        stream: {
          isConfigured: () => true,
          replayMs: 1_000,
          catchUp: async () => {
            events.push("catchUp");
            return ok({ value: outcome });
          },
          start: () => {
            events.push("start");
            return { stop: () => events.push("stop") };
          },
        },
      },
    });
    setProviderAdapter({ key: "FORTNOX", adapter: stream.adapter });
    const handles = await startProviderStreams({ db });
    for (const handle of handles) handle.stop();
    expect(events).toEqual(["catchUp", "start", "stop"]);
  });
});
