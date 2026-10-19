import { describe, expect, it } from "vitest";
import {
  defineReconciliation,
  MAX_DIFFERING_ROWS,
  runReconciliations,
} from "../src/seed/demo/reconcile";

// The harness only passes the context through, so a stub is enough here.
const context = {} as Parameters<typeof runReconciliations>[0]["context"];

describe("reconciliation harness (ADR 0051)", () => {
  it("passes when every compare finds nothing", async () => {
    const check = defineReconciliation({
      name: "ok",
      rebuild: async () => [1, 2],
      compare: async ({ rebuilt }) => (rebuilt.length === 2 ? [] : ["wrong"]),
    });
    expect(await runReconciliations({ context, checks: [check] })).toEqual([]);
  });

  it("names the check and caps the differing rows", async () => {
    const rows = Array.from({ length: MAX_DIFFERING_ROWS + 2 }, (_, index) => `row ${index}`);
    const check = defineReconciliation({
      name: "drift",
      rebuild: async () => rows,
      compare: async ({ rebuilt }) => rebuilt,
    });
    const failures = await runReconciliations({ context, checks: [check] });
    expect(failures).toHaveLength(MAX_DIFFERING_ROWS + 1);
    expect(failures[0]).toBe("reconcile drift: row 0");
    expect(failures.at(-1)).toBe("reconcile drift: 2 more differing rows");
  });
});
