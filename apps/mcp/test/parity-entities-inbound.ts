import { provisionOrganization } from "@bibi/core";
import { orderInboundAddress } from "@bibi/core/inbound-address";
import { deliverInboundEmail } from "@bibi/core/inbound-mail";
import type { Json } from "./helpers";
import { byId, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

const domain = "in.parity.test";
const timeZone = "Europe/Stockholm";

/**
 * A received mail (ADR 0012, 0085). There is no user command that creates one: the inbound webhook
 * stores it as SYSTEM, so the parity test delivers it the same way to the order made earlier.
 */
const inboundEmail = (): ParityEntity => ({
  ...byId({
    name: "inboundEmail",
    field: "inboundEmail",
    list: "inbound-emails",
    createTool: "",
    args: {},
  }),
  create: async ({ made, mcp }) => {
    const address = orderInboundAddress({ orderId: made.order.id, domain });
    const delivered = await deliverInboundEmail({
      domain,
      mail: {
        providerEmailId: `email_${made.order.id}`,
        messageId: null,
        fromAddress: "Guest <guest@example.test>",
        toAddresses: [address],
        subject: "Re: parity",
        text: "Hej",
        html: null,
        attachments: [{ id: "att_1", filename: "a.pdf", contentType: null, size: 1 }],
        receivedAt: new Date("2026-11-01T08:00:00.000Z"),
        recipients: [address],
      },
    });
    if (!delivered.ok || delivered.value.status === "unmatched") throw new Error("Not stored");
    const id = delivered.value.inboundMessage.id;
    return tool({ mcp, name: "inboundEmail_get", args: { id } });
  },
});

const findById = ({ items, id }: { items: Json[]; id: string }) =>
  items.find((item) => item.id === id);

/** The organization's API endpoint (ADR 0085), provisioned as SYSTEM like at sign-up. */
const inboundEndpoint = (): ParityEntity => ({
  name: "inboundEndpoint",
  create: async ({ mcp, context }) => {
    // Provisioned like a sign-up; a test organization has no slug, so only its API endpoint.
    const { organizationId } = context;
    const made = await provisionOrganization({ organizationId, timeZone, pipeline: "none" });
    if (!made.ok) throw made.error;
    const listed = await tool({ mcp, name: "inboundEndpoint_list", args: { channel: "API" } });
    return listed.items[0];
  },
  viaMcp: async ({ mcp, created }) =>
    findById({
      items: (await tool({ mcp, name: "inboundEndpoint_list", args: {} })).items,
      id: created.id,
    }),
  viaRest: async ({ context, created }) =>
    findById({
      items: (await createRestClient({ context }).get({ path: "/inbound-endpoints" })).items,
      id: created.id,
    }),
  viaGraph: async ({ context, created, keys }) => {
    const query = `{ inboundEndpoints { items { ${keys.join(" ")} } } }`;
    const data = await gqlQuery({ context, query });
    return findById({ items: data.inboundEndpoints.items, id: created.id });
  },
});

/** An API message handed in through the endpoint above (`inboundMessage.submit`). */
const inboundMessage = (): ParityEntity => ({
  ...byId({
    name: "inboundMessage",
    field: "inboundMessage",
    list: "inbound-messages",
    createTool: "",
    args: {},
  }),
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "inboundMessage_submit",
      args: {
        endpointId: made.inboundEndpoint.id,
        subject: "Tasting",
        text: "A tasting for 14 on the 21st",
        formFields: { guests: 14 },
      },
    }),
});

/** Inbound messages and their endpoints; a function so the import cycle resolves. */
export function inboundEntities(): ParityEntity[] {
  return [inboundEmail(), inboundEndpoint(), inboundMessage()];
}
