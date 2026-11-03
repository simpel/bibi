import { createId } from "@paralleldrive/cuid2";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { checkReadable } from "../ticket/ticket-rules";
import { archiveMessage } from "./archive-message";
import { attachMessage } from "./attach-message";
import { callerSender } from "./caller-sender";
import { insertMessage } from "./insert-message";
import {
  InboundMessageAttachInputSchema,
  InboundMessageIdInputSchema,
  InboundMessageSchema,
  InboundMessageSubmitInputSchema,
} from "./schema";
import { setRead } from "./set-read";

export const attachInboundMessage = defineOperation({
  name: "inboundMessage.attachToTicket",
  kind: "command",
  description:
    "Attach a message from the inbox to an active ticket (needs ticket:write). A message is " +
    "attached once: one that already has a ticket is refused with CONFLICT and never moved.",
  input: InboundMessageAttachInputSchema,
  output: InboundMessageSchema,
  untrustedOutput: true,
  permission: "inbox:write",
  entityType: "inboundMessage",
  handler: async ({ input: { id, ticketId }, context }) => {
    const access = checkReadable({ context, permission: "ticket:write", path: "ticketId" });
    if (!access.ok) return access;
    if ((await context.db.ticket.count({ where: { id: ticketId } })) === 0) {
      const message = "Unknown ticket";
      return invalid({ message, issues: [{ path: "ticketId", message }] });
    }
    return attachMessage({ context, id, ticketId });
  },
});

export const markInboundMessageRead = defineOperation({
  name: "inboundMessage.markRead",
  kind: "command",
  description:
    "Mark a message read for the whole team (ADR 0085): the read state is shared, not per " +
    "member. Opening a message in the app marks it read. A read message leaves the inbox count.",
  input: InboundMessageIdInputSchema,
  output: InboundMessageSchema,
  untrustedOutput: true,
  permission: "inbox:write",
  entityType: "inboundMessage",
  handler: async ({ input: { id }, context }) => setRead({ context, id, read: true }),
});

export const markInboundMessageUnread = defineOperation({
  name: "inboundMessage.markUnread",
  kind: "command",
  description: "Mark a message unread again for the whole team, e.g. to come back to it later.",
  input: InboundMessageIdInputSchema,
  output: InboundMessageSchema,
  untrustedOutput: true,
  permission: "inbox:write",
  entityType: "inboundMessage",
  handler: async ({ input: { id }, context }) => setRead({ context, id, read: false }),
});

export const deleteInboundMessage = defineOperation({
  name: "inboundMessage.delete",
  kind: "command",
  description:
    "Delete a message from the inbox (spam, a newsletter, nothing to book). It is archived, " +
    "not erased, and no longer listed. Only messages without a ticket: one attached to a ticket " +
    "is refused with CONFLICT.",
  input: InboundMessageIdInputSchema,
  output: InboundMessageSchema,
  untrustedOutput: true,
  permission: "inbox:delete",
  entityType: "inboundMessage",
  handler: async ({ input: { id }, context }) => archiveMessage({ context, id }),
});

/**
 * The API channel (ADR 0085 decision 4): an outside system or assistant hands a request in. It is
 * stored as an `API` message from the caller, never as mail, and lands in the inbox; it creates
 * no ticket. Not for Bibi's own assistant (`aiAllowed: false`): it drafts from messages, it does
 * not invent them.
 */
export const submitInboundMessage = defineOperation({
  name: "inboundMessage.submit",
  kind: "command",
  description:
    "Hand a request in to the organization's inbox through its API endpoint " +
    "(inboundEndpoint.list, channel API), e.g. from a partner system: a subject, the request " +
    "as text and optional structured `formFields`. It is stored as an API message from the " +
    "caller and creates no ticket; staff create the ticket from it. Needs inbox:submit.",
  input: InboundMessageSubmitInputSchema,
  output: InboundMessageSchema,
  untrustedOutput: true,
  permission: "inbox:submit",
  aiAllowed: false,
  handler: async ({ input: { endpointId, subject, text, formFields }, context }) => {
    const where = { id: endpointId, channel: "API" as const, active: true };
    if ((await context.db.inboundEndpoint.count({ where })) === 0) {
      const message = "Not an active API endpoint of the organization";
      return invalid({ message, issues: [{ path: "endpointId", message }] });
    }
    const id = createId();
    const { apiKeyId = null, userId } = context.actor;
    const message = await insertMessage({
      context,
      message: {
        id,
        channel: "API",
        endpointId,
        ticketId: null,
        ...(await callerSender({ context })),
        fromPhone: null,
        subject: subject ?? null,
        text,
        formFields: formFields ?? null,
        attachments: [],
        externalId: id,
        receivedAt: nowOf({ context }),
        details: { apiKeyId, userId },
      },
    });
    return ok({ value: message });
  },
});
