import { describe, expect, it } from "vitest";
import { lastValue, settle } from "./live-query-state";

const error = { code: "NOT_FOUND" as const, message: "gone", issues: [] };

describe("settle", () => {
  it("is ready with the value of a successful call", async () => {
    const state = await settle({
      input: 2,
      load: async (n: number) => ({ ok: true, value: n * 2 }),
    });
    expect(state).toEqual({ status: "ready", value: 4 });
  });

  it("is the error key of a failed result", async () => {
    const state = await settle({ input: 1, load: async () => ({ ok: false, error }) });
    expect(state).toEqual({ status: "error", errorKey: "notFound" });
  });

  it("is the network error when the call throws", async () => {
    const state = await settle({ input: 1, load: () => Promise.reject(new Error("offline")) });
    expect(state).toEqual({ status: "error", errorKey: "network" });
  });
});

describe("lastValue", () => {
  it("keeps the value while loading and drops it after idle or an error", () => {
    expect(lastValue({ state: { status: "ready", value: "a" } })).toBe("a");
    expect(lastValue({ state: { status: "loading", previous: "a" } })).toBe("a");
    expect(lastValue({ state: { status: "idle" } })).toBeNull();
    expect(lastValue({ state: { status: "error", errorKey: "network" } })).toBeNull();
  });
});
