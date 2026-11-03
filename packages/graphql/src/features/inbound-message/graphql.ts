import {
  attachInboundMessage,
  countOpenInboundMessages,
  dismissInboundMessage,
  getInboundMessage,
  type InboundEndpointDto,
  InboundEndpointSchema,
  type InboundMessageDto,
  InboundMessageOpenCountOutputSchema,
  InboundMessageSchema,
  listInboundEndpoints,
  listInboundMessages,
  restoreInboundMessage,
  submitInboundMessage,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { type Page, pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { TicketRef } from "../ticket/graphql";

export const InboundMessageRef = objectFromSchema<InboundMessageDto>({
  name: "InboundMessage",
  schema: InboundMessageSchema,
  omit: ["organizationId"],
  description:
    "A message that came in on any channel (email, web form, SMS, API; ADR 0085): sender, " +
    "subject, text, form fields and attachment metadata. Written by outside senders.",
});
const InboundMessagePageRef = pageType({ name: "InboundMessagePage", item: InboundMessageRef });

const InboundEndpointRef = objectFromSchema<InboundEndpointDto>({
  name: "InboundEndpoint",
  schema: InboundEndpointSchema,
  omit: ["organizationId"],
  description: "Where the organization's messages come in: its inbox address or its API.",
});
const InboundEndpointListRef = builder
  .objectRef<{ items: InboundEndpointDto[] }>("InboundEndpointList")
  .implement({
    fields: (t) => ({
      items: t.field({ type: [InboundEndpointRef], resolve: (list) => list.items }),
    }),
  });

fieldFromOperation({
  operation: listInboundMessages,
  type: InboundMessagePageRef,
  name: "inboundMessages",
});
const InboundMessageOpenCountRef = objectFromSchema<{ open: number }>({
  name: "InboundMessageOpenCount",
  schema: InboundMessageOpenCountOutputSchema,
  description: "How many messages wait in the inbox (no ticket yet, not dismissed).",
});
fieldFromOperation({
  operation: countOpenInboundMessages,
  type: InboundMessageOpenCountRef,
  name: "inboundMessageOpenCount",
});
fieldFromOperation({
  operation: getInboundMessage,
  type: InboundMessageRef,
  name: "inboundMessage",
});
fieldFromOperation({
  operation: listInboundEndpoints,
  type: InboundEndpointListRef,
  name: "inboundEndpoints",
});
mutationFromOperation({ operation: submitInboundMessage, type: InboundMessageRef });
mutationFromOperation({ operation: attachInboundMessage, type: InboundMessageRef });
mutationFromOperation({ operation: dismissInboundMessage, type: InboundMessageRef });
mutationFromOperation({ operation: restoreInboundMessage, type: InboundMessageRef });

// Graph edge. Goes through `inboundMessage.list`, so its permissions apply here too.
builder.objectField(TicketRef, "inboundMessages", (t) =>
  t.field({
    type: [InboundMessageRef],
    description: "Messages of every channel attached to the ticket, newest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (ticket, { limit }, ctx) => {
      const input = { ticketId: ticket.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) };
      const page = (await runOperation({
        operation: listInboundMessages,
        input,
        ctx,
      })) as Page<InboundMessageDto>;
      return page.items;
    },
  }),
);
