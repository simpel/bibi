import { type ExecuteContext, provisionOrganization } from "@bibi/core";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { gqlQuery } from "./parity-graphql";
import { seedTicket } from "./seed-ticket";

const timeZone = "Europe/Stockholm";

/** The organization's API endpoint, provisioned like at sign-up. */
async function apiEndpoint({ context, client }: { context: ExecuteContext; client: Client }) {
  // Provisioned like a sign-up; a test organization has no slug, so only its API endpoint.
  const { organizationId } = context;
  const made = await provisionOrganization({ organizationId, timeZone, pipeline: "none" });
  if (!made.ok) throw made.error;
  const listed = await call({ client, name: "inboundEndpoint_list", args: { channel: "API" } });
  return listed.data.items[0].id as string;
}

/** A message handed in to the client's organization through its API endpoint. */
async function seedMessage({ context, client }: { context: ExecuteContext; client: Client }) {
  const endpointId = await apiEndpoint({ context, client });
  const args = { endpointId, subject: "Secret", text: "Secret request" };
  const submitted = await call({ client, name: "inboundMessage_submit", args });
  return { id: submitted.data.id as string, endpointId };
}

describe("cross-organization isolation for the inbox (ADR 0085)", () => {
  it("hides one organization's messages and endpoints from another", async () => {
    const contextA = testContext();
    const contextB = testContext();
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });
    const secret = await seedMessage({ context: contextA, client: a });
    const own = await seedMessage({ context: contextB, client: b });
    const ticketA = await seedTicket({ client: a });
    const ticketB = await seedTicket({ client: b });

    for (const name of ["inboundMessage_get", "inboundMessage_dismiss", "inboundMessage_restore"]) {
      const refused = await call({ client: b, name, args: { id: secret.id } });
      expect(refused.data.code, name).toBe("NOT_FOUND");
    }
    const attach = await call({
      client: b,
      name: "inboundMessage_attachToTicket",
      args: { id: secret.id, ticketId: ticketB.id },
    });
    expect(attach.data.code).toBe("NOT_FOUND");
    const intoForeignTicket = await call({
      client: b,
      name: "inboundMessage_attachToTicket",
      args: { id: own.id, ticketId: ticketA.id },
    });
    expect(intoForeignTicket.data.code).toBe("VALIDATION");
    const submit = await call({
      client: b,
      name: "inboundMessage_submit",
      args: { endpointId: secret.endpointId, text: "Probe" },
    });
    expect(submit.data.code).toBe("VALIDATION");

    const inbox = await call({ client: b, name: "inboundMessage_list", args: {} });
    expect(inbox.data.items.map((item: { id: string }) => item.id)).toEqual([own.id]);
    const count = await call({ client: b, name: "inboundMessage_openCount", args: {} });
    expect(count.data.open).toBe(1);
    const byTicket = await call({
      client: b,
      name: "inboundMessage_list",
      args: { ticketId: ticketA.id },
    });
    expect(byTicket.data.items).toEqual([]);
    const endpoints = await call({ client: b, name: "inboundEndpoint_list", args: {} });
    const ids = endpoints.data.items.map((item: { id: string }) => item.id);
    expect(ids).not.toContain(secret.endpointId);

    const created = await call({
      client: b,
      name: "ticket_create",
      args: {
        entityTypeId: ticketB.entityTypeId,
        customerId: ticketB.customerId,
        contactId: ticketB.contactId,
        inboundMessageId: secret.id,
      },
    });
    expect(created.data.code).toBe("VALIDATION");
    const query = "query($id: String!) { inboundMessage(id: $id) { id } }";
    await expect(
      gqlQuery({ context: contextB, query, variables: { id: secret.id } }),
    ).rejects.toThrow();
  });
});
