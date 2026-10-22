import { appError, err, ok, type Result } from "@bibi/core";
import { z } from "zod";
import type { InboundMail, InboundRequest } from "../schema";
import { verifySvixSignature } from "./verify-svix-signature";

const EventSchema = z.object({ type: z.string(), data: z.unknown() });

const ReceivedSchema = z.object({
  email_id: z.string().min(1),
  message_id: z.string().nullish(),
  from: z.string().min(1),
  to: z.array(z.string()),
  subject: z.string().nullish(),
  created_at: z.string().nullish(),
});

export type ParseResendInboundInput = { request: InboundRequest; webhookSecret?: string };

function parseJson({ body }: { body: string }): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

/** Verifies and parses Resend's `email.received` webhook (metadata only, ADR 0012). */
export function parseResendInbound({
  request,
  webhookSecret,
}: ParseResendInboundInput): Result<InboundMail | null> {
  if (!webhookSecret) {
    return err({
      error: appError({ code: "UNAVAILABLE", message: "RESEND_WEBHOOK_SECRET is not set" }),
    });
  }
  if (
    !verifySvixSignature({ headers: request.headers, body: request.body, secret: webhookSecret })
  ) {
    return err({
      error: appError({ code: "UNAUTHENTICATED", message: "Invalid webhook signature" }),
    });
  }
  const event = EventSchema.safeParse(parseJson({ body: request.body }));
  if (!event.success)
    return err({ error: appError({ code: "VALIDATION", message: "Invalid webhook payload" }) });
  if (event.data.type !== "email.received") return ok({ value: null });
  const data = ReceivedSchema.safeParse(event.data.data);
  if (!data.success)
    return err({
      error: appError({ code: "VALIDATION", message: "Invalid email.received payload" }),
    });
  return ok({
    value: {
      providerEmailId: data.data.email_id,
      messageId: data.data.message_id ?? null,
      from: data.data.from,
      to: data.data.to,
      subject: data.data.subject ?? null,
      receivedAt: data.data.created_at ?? null,
    },
  });
}
