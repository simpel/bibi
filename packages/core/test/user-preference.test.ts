import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
  type ExecuteContext,
  execute,
  listAuditLogs,
  listUserPreferences,
  setUserPreference,
} from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";

type SetInput = { context: ExecuteContext; key: string; value: unknown };

const set = ({ context, key, value }: SetInput) =>
  execute({ operation: setUserPreference, input: { key, value }, context });

const list = async ({ context, prefix }: { context: ExecuteContext; prefix?: string }) =>
  unwrap({
    result: await execute({ operation: listUserPreferences, input: { prefix }, context }),
  }).items.map(({ key, value }) => ({ key, value }));

describe("userPreference operations (ADR 0039)", () => {
  it("saves, replaces and lists the caller's preferences, filtered by prefix", async () => {
    const context = testContext({ permissions: {} });
    unwrap({ result: await set({ context, key: "table.columns.a", value: ["x", "y"] }) });
    unwrap({ result: await set({ context, key: "theme.density", value: null }) });
    const saved = unwrap({ result: await set({ context, key: "table.columns.a", value: ["y"] }) });
    expect(saved).toMatchObject({ key: "table.columns.a", value: ["y"] });
    expect(await list({ context })).toEqual([
      { key: "table.columns.a", value: ["y"] },
      { key: "theme.density", value: null },
    ]);
    expect(await list({ context, prefix: "table.columns." })).toEqual([
      { key: "table.columns.a", value: ["y"] },
    ]);
  });

  it("audits every change with before and after", async () => {
    const context = testContext();
    await set({ context, key: "table.columns.a", value: ["x"] });
    const saved = unwrap({ result: await set({ context, key: "table.columns.a", value: ["y"] }) });
    const input = { entityType: "userPreference", entityId: saved.id };
    const rows = unwrap({ result: await execute({ operation: listAuditLogs, input, context }) });
    expect(rows.items).toHaveLength(2);
    expect(rows.items.map((row) => row.actorId)).toEqual([
      context.actor.userId,
      context.actor.userId,
    ]);
    expect(rows.items[0]).toMatchObject({ before: { value: ["x"] }, after: { value: ["y"] } });
  });

  it("never lets user B read or write user A's preferences, in any organization", async () => {
    const userA = testContext({ access: "read" });
    const adminB = peer({ of: userA, access: "admin" });
    const otherOrgB = testContext({ actor: adminB.actor });
    await set({ context: userA, key: "table.columns.a", value: ["a"] });
    expect(await list({ context: adminB })).toEqual([]);
    expect(await list({ context: otherOrgB })).toEqual([]);
    await set({ context: adminB, key: "table.columns.a", value: ["b"] });
    expect(await list({ context: userA })).toEqual([{ key: "table.columns.a", value: ["a"] }]);
    expect(await list({ context: otherOrgB })).toEqual([{ key: "table.columns.a", value: ["b"] }]);
  });

  it("follows the user across organizations", async () => {
    const userA = testContext({ permissions: {} });
    const elsewhere = testContext({ actor: userA.actor, permissions: {} });
    await set({ context: userA, key: "table.columns.a", value: ["a"] });
    expect(await list({ context: elsewhere })).toEqual([{ key: "table.columns.a", value: ["a"] }]);
  });

  it("rejects bad keys, oversized values and the system actor", async () => {
    const context = testContext();
    expect(errorCode({ result: await set({ context, key: "Bad Key", value: 1 }) })).toBe(
      "VALIDATION",
    );
    expect(errorCode({ result: await set({ context, key: "a".repeat(201), value: 1 }) })).toBe(
      "VALIDATION",
    );
    const big = "x".repeat(10 * 1024);
    expect(errorCode({ result: await set({ context, key: "big", value: big }) })).toBe(
      "VALIDATION",
    );
    const system = testContext({ actor: { type: "system", userId: null } });
    expect(errorCode({ result: await set({ context: system, key: "a", value: 1 }) })).toBe(
      "FORBIDDEN",
    );
    const key = `ok-${createId()}`;
    expect(errorCode({ result: await set({ context, key, value: { a: [1, true] } }) })).toBeNull();
  });
});
