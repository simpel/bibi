import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import { writeLegacyEmail } from "../inbound-email/write-legacy-email";
import { insertMessage } from "./insert-message";
import {
  type InboundMessageReceiveInput,
  InboundMessageReceiveInputSchema,
} from "./receive-schema";
import { InboundMessageSchema } from "./schema";
import { toInboundMessageDto } from "./to-inbound-message-dto";

type Input = { context: OperationContext; input: InboundMessageReceiveInput };

/** The endpoint must be an active one of the channel; the reply hint an active ticket. */
async function checkRoute({ context, input }: Input): Promise<Result<true>> {
  const { endpointId, ticketId, channel } = input;
  if (!endpointId && !ticketId) return invalid({ message: "An endpoint or a ticket is required" });
  if (endpointId) {
    const where = { id: endpointId, channel, active: true };
    if ((await context.db.inboundEndpoint.count({ where })) === 0) {
      return notFound({ entity: "Inbound endpoint" });
    }
  }
  if (ticketId && (await context.db.ticket.count({ where: { id: ticketId } })) === 0) {
    return notFound({ entity: "Ticket" });
  }
  return ok({ value: true });
}

/**
 * Stores a message a channel adapter received (ADR 0085 decision 3). SYSTEM only: the adapter
 * has authenticated its provider. Deliberately not part of `createCoreOperations`: no user, AI or
 * API surface can make something look like it arrived by mail (ADR 0012). Idempotent per
 * organization, channel and `externalId`: a redelivery returns the stored message.
 */
export const receiveInboundMessage = defineOperation({
  name: "inboundMessage.receive",
  kind: "command",
  description: "Store a message a channel adapter received (channel adapters only).",
  input: InboundMessageReceiveInputSchema,
  output: InboundMessageSchema,
  permission: "inbox:write",
  approval: false,
  aiAllowed: false,
  handler: async ({ input, context }) => {
    if (context.actor.type !== "system") {
      const message = "Received messages are stored by channel adapters only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const { channel, externalId, details, ...fields } = input;
    const known = await context.db.inboundMessage.findFirst({ where: { channel, externalId } });
    if (known) return ok({ value: toInboundMessageDto({ row: known }) });
    const route = await checkRoute({ context, input });
    if (!route.ok) return route;
    const message = { ...fields, channel, externalId, details };
    const stored = await insertMessage({ context, message });
    await writeLegacyEmail({ context, message: stored, details });
    return ok({ value: stored });
  },
});
