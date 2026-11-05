import { type ExecuteContext, ok, provisionOrganization, setExtract } from "@bibi/core";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { afterEach, describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

const EMPTY_DRAFT = {
  ...{ senderName: null, company: null, email: null, phone: null },
  ...{ date: null, start: null, end: null, headcount: null },
  ...{ wish: null, packageName: null, needs: [], notes: null },
};

afterEach(() => setExtract({ extract: undefined }));

/** A message handed in to the organization through its API endpoint (ADR 0085). */
async function seedMessage({ context, client }: { context: ExecuteContext; client: Client }) {
  const { organizationId } = context;
  const made = await provisionOrganization({
    ...{ organizationId, timeZone: "Europe/Stockholm" },
    pipeline: "none",
  });
  if (!made.ok) throw made.error;
  const listed = await call({ client, name: "inboundEndpoint_list", args: { channel: "API" } });
  const args = { endpointId: listed.data.items[0].id, text: "Secret request for 14" };
  return (await call({ client, name: "inboundMessage_submit", args })).data.id as string;
}

describe("cross-organization isolation for drafts read from a message (ADR 0084)", () => {
  it("never reads another organization's message", async () => {
    setExtract({ extract: async () => ok({ value: EMPTY_DRAFT }) });
    const contextA = testContext();
    const a = await connect({ context: contextA });
    const b = await connect({ context: testContext() });
    const secret = await seedMessage({ context: contextA, client: a });
    const own = await call({
      client: a,
      name: "orderDraft_fromMessage",
      args: { inboundMessageId: secret },
    });
    expect(own.data.inboundMessageId).toBe(secret);
    const foreign = await call({
      client: b,
      name: "orderDraft_fromMessage",
      args: { inboundMessageId: secret },
    });
    expect(foreign.data.code).toBe("NOT_FOUND");
  });
});
