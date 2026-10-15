import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { InboundEmailReceiveInputSchema, InboundEmailSchema } from "./schema";
import { toInboundEmailDto } from "./to-inbound-email-dto";

/**
 * Stores a received mail on its booking (ADR 0012). SYSTEM only: the inbound webhook runs it
 * after verifying the provider's signature. It is deliberately not part of `createCoreOperations`
 * (no user, AI or API surface can create a received mail), so it has no web, GraphQL, REST or
 * MCP adapter; the mails are read with `inboundEmail.list|get` on every surface.
 * Idempotent per `providerEmailId`: a redelivered webhook returns the stored mail.
 */
export const receiveInboundEmail = defineOperation({
  name: "inboundEmail.receive",
  kind: "command",
  description: "Store a mail received on a booking's inbound address (inbound webhook only).",
  input: InboundEmailReceiveInputSchema,
  output: InboundEmailSchema,
  permission: "booking:write",
  approval: false,
  handler: async ({ input, context }) => {
    if (context.actor.type !== "system") {
      const message = "Received mail is stored by the inbound webhook only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const booking = await context.db.booking.findFirst({ where: { id: input.bookingId } });
    if (!booking) return notFound({ entity: "Booking" });
    const { providerEmailId } = input;
    const existing = await context.db.inboundEmail.findFirst({ where: { providerEmailId } });
    if (existing) return ok({ value: toInboundEmailDto({ row: existing }) });
    const row = await context.db.inboundEmail.create({
      data: {
        ...input,
        attachments: toJson({ value: input.attachments }) ?? [],
        organizationId: context.organizationId,
      },
    });
    const { id, bookingId, fromAddress, subject, receivedAt } = row;
    context.recordChange({
      entityId: id,
      after: { id, bookingId, providerEmailId, fromAddress, subject, receivedAt },
    });
    return ok({ value: toInboundEmailDto({ row }) });
  },
});
