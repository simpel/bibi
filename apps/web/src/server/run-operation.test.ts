import { getOrganizationProfile } from "@bibi/core";
import { describe, expect, it, vi } from "vitest";

const prerenderBailout = new Error("headers() during prerender");

vi.mock("next/headers", () => ({
  headers: () => Promise.reject(prerenderBailout),
}));

const ensureOperations = vi.fn();
vi.mock("./operations", () => ({ ensureOperations }));

const { runOperation } = await import("./run-operation");

describe("runOperation", () => {
  it("reads the request before the runtime env, so a build-time prerender bails out to dynamic", async () => {
    await expect(runOperation({ operation: getOrganizationProfile, input: {} })).rejects.toBe(
      prerenderBailout,
    );
    expect(ensureOperations).not.toHaveBeenCalled();
  });
});
