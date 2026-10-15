import { describe, expect, it } from "vitest";
import { createCoreOperations } from "../src/core-operations";
import { InboundEmailSchema } from "../src/features/inbound-email/schema";
import { fakeEmbed } from "./fake-embed";

/** True when `target` appears anywhere inside the Zod schema graph of `node`. */
function contains({
  node,
  target,
  seen,
}: {
  node: unknown;
  target: unknown;
  seen: Set<unknown>;
}): boolean {
  if (node === target) return true;
  if (typeof node !== "object" || node === null || seen.has(node)) return false;
  seen.add(node);
  return Object.values(node).some((child) => contains({ node: child, target, seen }));
}

describe("untrusted output flag", () => {
  const operations = createCoreOperations({ embed: fakeEmbed });

  it("flags every operation whose output includes an inbound email", () => {
    const missing = operations
      .filter((op) => contains({ node: op.output, target: InboundEmailSchema, seen: new Set() }))
      .filter((op) => !op.untrustedOutput)
      .map((op) => op.name);
    expect(missing).toEqual([]);
  });

  it("flags the inbound email read operations", () => {
    const flagged = operations.filter((op) => op.untrustedOutput).map((op) => op.name);
    expect(flagged).toEqual(expect.arrayContaining(["inboundEmail.list", "inboundEmail.get"]));
  });
});
