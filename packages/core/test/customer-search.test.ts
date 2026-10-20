import { describe, expect, it } from "vitest";
import {
  createContact,
  createCustomer,
  createEntityType,
  createIndexingHook,
  createSearchOperation,
  type ExecuteContext,
  execute,
} from "../src/index";
import { fakeEmbed } from "./fake-embed";
import { testContext, unwrap } from "./helpers";

const afterCommit = [createIndexingHook({ embed: fakeEmbed })];
const search = createSearchOperation({ embed: fakeEmbed });

type SeedInput = { context: ExecuteContext };

async function seed({ context }: SeedInput) {
  const type = async ({ base }: { base: "CUSTOMER" | "CONTACT" }) =>
    unwrap({
      result: await execute({ operation: createEntityType, input: { base, name: base }, context }),
    });
  const customer = unwrap({
    result: await execute({
      operation: createCustomer,
      input: { entityTypeId: (await type({ base: "CUSTOMER" })).id, name: "Nordkust Logistik AB" },
      context,
      afterCommit,
    }),
  });
  const input = {
    customerId: customer.id,
    entityTypeId: (await type({ base: "CONTACT" })).id,
    name: "Karin Wallin",
  };
  unwrap({ result: await execute({ operation: createContact, input, context, afterCommit }) });
  return { customer };
}

describe("customer and contact search (ADR 0008, 0022)", () => {
  it("indexes customers and contacts and hides them from callers who may not read them", async () => {
    const context = testContext();
    const { customer } = await seed({ context });
    const hits = unwrap({
      result: await execute({ operation: search, input: { query: "Nordkust" }, context }),
    }).hits;
    expect(hits.map((hit) => hit.entityType).sort()).toEqual(["contact", "customer"]);
    expect(hits.find((hit) => hit.entityType === "customer")?.entityId).toBe(customer.id);
    const kitchen = testContext({
      organizationId: context.organizationId,
      permissions: { item: ["read"] },
    });
    const hidden = unwrap({
      result: await execute({ operation: search, input: { query: "Nordkust" }, context: kitchen }),
    });
    expect(hidden.hits).toEqual([]);
  });
});
