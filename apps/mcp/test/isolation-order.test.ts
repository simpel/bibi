import { orderInboundAddress } from "@bibi/core/inbound-address";
import { deliverInboundEmail } from "@bibi/core/inbound-mail";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { gqlQuery } from "./parity-graphql";
import { seedOrder } from "./seed-order";

describe("cross-organization isolation for orders", () => {
  it("hides one organization's orders from another across tools and graph", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { id } = await seedOrder({ client: a });
    const statusB = await call({
      client: b,
      name: "orderStatus_create",
      args: { name: "Other status", color: "#ef4444" },
    });
    for (const [name, args] of [
      ["order_get", { id }],
      ["order_view", { id }],
      ["order_changeStatus", { orderId: id, statusId: statusB.data.id }],
      ["order_export", { id }],
      ["order_statusHistory", { orderId: id }],
      ["order_estimateHistory", { orderId: id }],
      ["order_update", { id, estimatedHeadcount: 99 }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    expect((await call({ client: b, name: "order_list" })).data.items).toEqual([]);
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { orders { items { id } } }" },
    });
    expect(graph.data.data.orders.items).toEqual([]);
    const own = await call({ client: a, name: "order_get", args: { id } });
    expect(own.data.estimatedHeadcount).toBe(12);
    const view = await call({ client: a, name: "order_view", args: { id } });
    expect(view.data.guestCount).toBe(12);
  });

  it("hides one organization's inbound emails from another across tools and graph", async () => {
    const contextA = testContext();
    const contextB = testContext();
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });
    const { id: orderId } = await seedOrder({ client: a });
    const domain = "in.isolation.test";
    const address = orderInboundAddress({ orderId, domain });
    const delivered = await deliverInboundEmail({
      domain,
      mail: {
        providerEmailId: `email_${orderId}`,
        messageId: null,
        fromAddress: "Guest <guest@example.test>",
        toAddresses: [address],
        subject: "Secret reply",
        text: "Secret",
        html: null,
        attachments: [],
        receivedAt: new Date("2026-11-01T08:00:00.000Z"),
        recipients: [address],
      },
    });
    if (!delivered.ok || delivered.value.status === "unmatched") throw new Error("Not stored");
    const id = delivered.value.inboundMessage.id;

    const own = await call({ client: a, name: "inboundEmail_list", args: { orderId } });
    expect(own.data.items.map((item: { id: string }) => item.id)).toEqual([id]);
    expect((await call({ client: b, name: "inboundEmail_get", args: { id } })).data.code).toBe(
      "NOT_FOUND",
    );
    const listed = await call({ client: b, name: "inboundEmail_list", args: { orderId } });
    expect(listed.data.items).toEqual([]);
    const query = "query($orderId: String!) { inboundEmails(orderId: $orderId) { items { id } } }";
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query, variables: { orderId } },
    });
    expect(graph.data.data.inboundEmails.items).toEqual([]);
    const direct = await gqlQuery({ context: contextB, query, variables: { orderId } });
    expect(direct.inboundEmails.items).toEqual([]);
  });
});
