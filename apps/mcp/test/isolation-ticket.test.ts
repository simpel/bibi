import { deliverInboundEmail, ticketInboundAddress } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { gqlQuery } from "./parity-graphql";
import { seedTicket } from "./seed-ticket";

describe("cross-organization isolation for tickets", () => {
  it("hides one organization's tickets from another across tools and graph", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { id } = await seedTicket({ client: a });
    const phaseB = await call({
      client: b,
      name: "ticketPhase_create",
      args: { name: "Other phase", color: "#ef4444" },
    });
    for (const [name, args] of [
      ["ticket_get", { id }],
      ["ticket_changePhase", { ticketId: id, phaseId: phaseB.data.id }],
      ["ticket_export", { id }],
      ["ticket_phaseHistory", { ticketId: id }],
      ["ticket_update", { id, estimatedHeadcount: 99 }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    expect((await call({ client: b, name: "ticket_list" })).data.items).toEqual([]);
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { tickets { items { id } } }" },
    });
    expect(graph.data.data.tickets.items).toEqual([]);
    const own = await call({ client: a, name: "ticket_get", args: { id } });
    expect(own.data.estimatedHeadcount).toBe(12);
  });

  it("hides one organization's inbound emails from another across tools and graph", async () => {
    const contextA = testContext();
    const contextB = testContext();
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });
    const { id: ticketId } = await seedTicket({ client: a });
    const domain = "in.isolation.test";
    const address = ticketInboundAddress({ ticketId, domain });
    const delivered = await deliverInboundEmail({
      domain,
      mail: {
        providerEmailId: `email_${ticketId}`,
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
    const id = delivered.value.inboundEmail.id;

    const own = await call({ client: a, name: "inboundEmail_list", args: { ticketId } });
    expect(own.data.items.map((item: { id: string }) => item.id)).toEqual([id]);
    expect((await call({ client: b, name: "inboundEmail_get", args: { id } })).data.code).toBe(
      "NOT_FOUND",
    );
    const listed = await call({ client: b, name: "inboundEmail_list", args: { ticketId } });
    expect(listed.data.items).toEqual([]);
    const query =
      "query($ticketId: String!) { inboundEmails(ticketId: $ticketId) { items { id } } }";
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query, variables: { ticketId } },
    });
    expect(graph.data.data.inboundEmails.items).toEqual([]);
    const direct = await gqlQuery({ context: contextB, query, variables: { ticketId } });
    expect(direct.inboundEmails.items).toEqual([]);
  });
});
