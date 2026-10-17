import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedBooking } from "./seed-booking";

describe("cross-organization isolation: inquiries", () => {
  it("hides one organization's inquiries from another across tools and graph", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { customerId } = await seedBooking({ client: a });
    const type = await call({
      client: a,
      name: "entityType_create",
      args: { base: "INQUIRY", name: "Secret inquiry" },
    });
    const inquiry = await call({
      client: a,
      name: "inquiry_create",
      args: { entityTypeId: type.data.id, customerId, quantity: 30 },
    });
    expect(inquiry.isError, JSON.stringify(inquiry.data)).toBe(false);
    const id = inquiry.data.id;
    for (const [name, args] of [
      ["inquiry_get", { id }],
      ["inquiry_update", { id, quantity: 99 }],
      ["inquiry_qualify", { id }],
      ["inquiry_markLost", { id, lossReason: "Hacked" }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    expect((await call({ client: b, name: "inquiry_list" })).data.items).toEqual([]);
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { inquiries { items { id } } }" },
    });
    expect(graph.data.data.inquiries.items).toEqual([]);
    const own = await call({ client: a, name: "inquiry_get", args: { id } });
    expect(own.data.quantity).toBe(30);
  });
});
