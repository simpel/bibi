import { afterEach, describe, expect, it } from "vitest";
import { revenueAccountResolver } from "../src/features/finance/account-map";
import { loadLedgerMappings } from "../src/features/finance/load-mappings";
import {
  requireConnectionMappings,
  requireMappings,
} from "../src/features/finance/require-mappings";
import {
  createEntityType,
  type ExecuteContext,
  execute,
  listAccountMappings,
  resetProviderAdapters,
  setAccountMapping,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { connectLedger } from "./ledger-helpers";

afterEach(() => resetProviderAdapters());

const list = async ({ context }: { context: ExecuteContext }) =>
  unwrap({ result: await execute({ operation: listAccountMappings, input: {}, context }) });

type SetInput = {
  context: ExecuteContext;
  purpose: "ADVANCES" | "REVENUE_DEFAULT" | "ENTITY_TYPE";
  providerAccount: string | null;
  entityTypeId?: string | null;
};

const set = ({ context, ...input }: SetInput) =>
  execute({ operation: setAccountMapping, input: { entityTypeId: null, ...input }, context });

async function itemType({ context }: { context: ExecuteContext }) {
  const input = { base: "ITEM" as const, name: `Rooms ${Math.random()}`, capabilities: [] };
  return unwrap({ result: await execute({ operation: createEntityType, input, context }) }).id;
}

describe("account mappings (ADR 0123)", () => {
  it("is empty and CONFLICT to change while no accounting system is connected", async () => {
    const context = testContext();
    expect(await list({ context })).toEqual({ provider: null, mappings: [] });
    const result = await set({ context, purpose: "ADVANCES", providerAccount: "2420" });
    expect(errorCode({ result })).toBe("CONFLICT");
  });

  it("maps purposes, several to one account, and replaces a mapping on the next set", async () => {
    const context = testContext();
    await connectLedger({ context });
    const typeId = await itemType({ context });
    unwrap({
      result: await set({
        context,
        purpose: "ENTITY_TYPE",
        entityTypeId: typeId,
        providerAccount: "3010",
      }),
    });
    unwrap({ result: await set({ context, purpose: "REVENUE_DEFAULT", providerAccount: "3010" }) });
    const replaced = unwrap({
      result: await set({ context, purpose: "ADVANCES", providerAccount: "2421" }),
    });
    expect(replaced.provider).toBe("VISMA");
    expect(replaced.mappings).toEqual(
      expect.arrayContaining([
        { purpose: "ADVANCES", entityTypeId: null, providerAccount: "2421" },
        { purpose: "REVENUE_DEFAULT", entityTypeId: null, providerAccount: "3010" },
        { purpose: "ENTITY_TYPE", entityTypeId: typeId, providerAccount: "3010" },
      ]),
    );
    expect(replaced.mappings.filter((m) => m.purpose === "ADVANCES")).toHaveLength(1);
  });

  it("removes a mapping with null, and rejects a purpose and type that do not fit", async () => {
    const context = testContext();
    await connectLedger({ context });
    const typeId = await itemType({ context });
    unwrap({
      result: await set({
        context,
        purpose: "ENTITY_TYPE",
        entityTypeId: typeId,
        providerAccount: "3010",
      }),
    });
    const cleared = unwrap({
      result: await set({
        context,
        purpose: "ENTITY_TYPE",
        entityTypeId: typeId,
        providerAccount: null,
      }),
    });
    expect(cleared.mappings.some((m) => m.purpose === "ENTITY_TYPE")).toBe(false);
    const bad = await set({
      context,
      purpose: "ADVANCES",
      entityTypeId: typeId,
      providerAccount: "2420",
    });
    expect(errorCode({ result: bad })).toBe("VALIDATION");
    const unknown = await set({
      context,
      purpose: "ENTITY_TYPE",
      entityTypeId: "nope",
      providerAccount: "3010",
    });
    expect(errorCode({ result: unknown })).toBe("VALIDATION");
  });

  it("keeps one organization's mappings from another", async () => {
    const first = testContext();
    const second = testContext();
    await connectLedger({ context: first });
    await connectLedger({ context: second });
    unwrap({
      result: await set({ context: first, purpose: "REVENUE_DEFAULT", providerAccount: "3777" }),
    });
    const other = await list({ context: second });
    expect(other.mappings.map((m) => m.providerAccount)).not.toContain("3777");
  });

  it("needs finance:write to change and finance:read to read", async () => {
    const reader = testContext({ access: "read" });
    expect(
      errorCode({
        result: await set({ context: reader, purpose: "ADVANCES", providerAccount: "2420" }),
      }),
    ).toBe("FORBIDDEN");
    const context = testContext();
    await connectLedger({ context });
    const writer = testContext({ access: "write" });
    expect(writer.organizationId).not.toBe(context.organizationId);
  });
});

describe("what invoices need mapped (ADR 0123)", () => {
  it("is CONFLICT naming what is unmapped, and ok once Deposits and Default revenue are", async () => {
    const context = testContext();
    const fake = await connectLedger({ context });
    expect(fake.portCalls).toEqual([]);
    const connection = await context.db.providerConnection.findFirstOrThrow({});
    await context.db.accountMapping.deleteMany({ where: { connectionId: connection.id } });
    const missing = await requireMappings({ context });
    expect(errorCode({ result: missing })).toBe("CONFLICT");
    expect(missing.ok ? "" : missing.error.message).toContain("Deposits and Default revenue");
    unwrap({ result: await set({ context, purpose: "ADVANCES", providerAccount: "2420" }) });
    const still = await requireConnectionMappings({
      context,
      connectionId: connection.id,
      provider: "VISMA",
    });
    expect(still.ok ? "" : still.error.message).toContain("Default revenue");
    unwrap({ result: await set({ context, purpose: "REVENUE_DEFAULT", providerAccount: "3001" }) });
    unwrap({ result: await requireMappings({ context }) });
  });

  it("resolves a line to its type's account, else Default revenue", async () => {
    const context = testContext();
    await connectLedger({ context });
    const typeId = await itemType({ context });
    unwrap({
      result: await set({
        context,
        purpose: "ENTITY_TYPE",
        entityTypeId: typeId,
        providerAccount: "3010",
      }),
    });
    const connection = await context.db.providerConnection.findFirstOrThrow({});
    const mappings = await loadLedgerMappings({ context, connectionId: connection.id });
    const accountOf = revenueAccountResolver({
      mappings,
      defaultRevenue: mappings.defaultRevenue ?? "",
    });
    const line = ({ entityTypeId }: { entityTypeId: string | null }) => ({
      itemId: null,
      vatRows: [],
      item: entityTypeId ? { entityTypeId } : null,
    });
    expect(accountOf({ line: line({ entityTypeId: typeId }) })).toBe("3010");
    expect(accountOf({ line: line({ entityTypeId: "other" }) })).toBe("3001");
    expect(accountOf({ line: line({ entityTypeId: null }) })).toBe("3001");
  });
});
