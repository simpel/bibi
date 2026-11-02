import { createId } from "@paralleldrive/cuid2";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { checkReadable } from "../ticket/ticket-rules";
import { attachMessage } from "./attach-message";
import { callerSender } from "./caller-sender";
import { insertMessage } from "./insert-message";
import {
  InboundMessageAttachInputSchema,
  InboundMessageIdInputSchema,
  InboundMessageSchema,
  InboundMessageSubmitInputSchema,
} from "./schema";
import { toInboundMessageDto } from "./to-inbound-message-dto";

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

type DismissInput = { context: OperationContext; id: string; dismiss: boolean };

/** Sets or clears the dismissal of an inbox message; an unchanged one is returned as is. */
async function setDismissed({ context, id, dismiss }: DismissInput) {
  const before = await context.db.inboundMessage.findFirst({ where: { id } });
  if (!before) return notFound({ entity: "Message" });
  if (before.ticketId) {
    return conflict({ message: "A message attached to a ticket is not in the inbox" });
  }
  if ((before.dismissedAt !== null) === dismiss)
    return ok({ value: toInboundMessageDto({ row: before }) });
  const { actor } = context;
  const data = dismiss
    ? { dismissedAt: nowOf({ context }), dismissedBy: actor.userId ?? actor.apiKeyId ?? actor.type }
    : { dismissedAt: null, dismissedBy: null };
  const row = await context.db.inboundMessage.update({ where: { id }, data });
  context.recordChange({
    entityId: id,
    before: { id, dismissedAt: before.dismissedAt, dismissedBy: before.dismissedBy },
    after: { id, ...data },
  });
  return ok({ value: toInboundMessageDto({ row }) });
}

export const dismissInboundMessage = defineOperation({
  name: "inboundMessage.dismiss",
  kind: "command",
  description:
    "Dismiss a message from the inbox (spam, a newsletter, nothing to book). Nothing is " +
    "deleted: inboundMessage.list with dismissed: true shows it and inboundMessage.restore " +
    "brings it back. Only messages without a ticket can be dismissed.",
  input: InboundMessageIdInputSchema,
  output: InboundMessageSchema,
  untrustedOutput: true,
  permission: "inbox:write",
  handler: async ({ input: { id }, context }) => setDismissed({ context, id, dismiss: true }),
});

export const restoreInboundMessage = defineOperation({
  name: "inboundMessage.restore",
  kind: "command",
  description: "Bring a dismissed message back into the inbox.",
  input: InboundMessageIdInputSchema,
  output: InboundMessageSchema,
  untrustedOutput: true,
  permission: "inbox:write",
  handler: async ({ input: { id }, context }) => setDismissed({ context, id, dismiss: false }),
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
