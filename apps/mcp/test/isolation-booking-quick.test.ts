import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, type Json, testContext } from "./helpers";
import { seedOrgMember } from "./seed-org-member";

const times = { startsAt: "2026-11-03T08:00:00.000Z", endsAt: "2026-11-03T16:00:00.000Z" };

type Created = { client: Client; tool: string; args: Record<string, unknown> };

async function create({ client, tool, args }: Created): Promise<string> {
  const result = await call({ client, name: tool, args });
  expect(result.isError, JSON.stringify(result.data)).toBe(false);
  return result.data.id as string;
}

type Org = { bookingType: string; programType: string; customerId: string; itemId: string };

/** Everything `booking.createQuick` needs, all owned by the client's organization. */
async function seedQuickOrg({ client }: { client: Client }): Promise<Org> {
  const type = ({ base, behaviours }: { base: string; behaviours?: string[] }) =>
    create({ client, tool: "entityType_create", args: { base, name: `Own ${base}`, behaviours } });
  const status = { name: "Own tentative", color: "#22c55e", phase: "TENTATIVE" };
  await create({ client, tool: "bookingStatus_create", args: status });
  const customerType = await type({ base: "CUSTOMER" });
  const itemType = await type({ base: "ITEM", behaviours: ["BOOKABLE"] });
  return {
    bookingType: await type({ base: "BOOKING" }),
    programType: await type({ base: "PROGRAM_ITEM" }),
    customerId: await create({
      client,
      tool: "customer_create",
      args: { entityTypeId: customerType, name: "Own AB" },
    }),
    itemId: await create({
      client,
      tool: "item_create",
      args: { entityTypeId: itemType, name: "Own hall" },
    }),
  };
}

const quickArgs = ({ org, ...override }: { org: Org } & Record<string, unknown>) => ({
  entityTypeId: org.bookingType,
  programItemTypeId: org.programType,
  customerId: org.customerId,
  itemId: org.itemId,
  quantity: 4,
  paymentMethod: "PAYMENT_LINK",
  ...times,
  ...override,
});

const issuePaths = ({ data }: { data: Json }): string[] =>
  data.issues.map((issue: { path: string }) => issue.path);

describe("cross-organization isolation: booking.createQuick", () => {
  it("accepts an organization's own ids but refuses another organization's", async () => {
    const contextB = testContext();
    const a = await connect({ context: testContext() });
    const b = await connect({ context: contextB });
    const orgA = await seedQuickOrg({ client: a });
    const orgB = await seedQuickOrg({ client: b });
    const assigneeId = (await seedOrgMember({ context: contextB })).userId;

    const ownB = await call({
      client: b,
      name: "booking_createQuick",
      args: quickArgs({ org: orgB, assigneeId }),
    });
    expect(ownB.isError, JSON.stringify(ownB.data)).toBe(false);

    const foreignItem = quickArgs({ org: orgB, assigneeId, itemId: orgA.itemId });
    const item = await call({ client: b, name: "booking_createQuick", args: foreignItem });
    expect(item.data.code).toBe("VALIDATION");
    expect(issuePaths({ data: item.data })).toContain("itemId");

    const foreignCustomer = quickArgs({ org: orgB, assigneeId, customerId: orgA.customerId });
    const customer = await call({ client: b, name: "booking_createQuick", args: foreignCustomer });
    expect(["NOT_FOUND", "VALIDATION"]).toContain(customer.data.code);

    const foreignTypes = quickArgs({ org: orgB, assigneeId, entityTypeId: orgA.bookingType });
    const types = await call({ client: b, name: "booking_createQuick", args: foreignTypes });
    expect(["NOT_FOUND", "VALIDATION"]).toContain(types.data.code);

    const listedB = await call({ client: b, name: "booking_list" });
    expect(listedB.data.items).toHaveLength(1);
    expect((await call({ client: a, name: "booking_list" })).data.items).toEqual([]);
    expect((await call({ client: a, name: "programItem_list" })).data.items).toEqual([]);
  });
});
