import { appError, err, ok, type Result } from "@okazi/core";
import { z } from "zod";
import type { InboundMailContent } from "../schema";
import { RESEND_API_URL, type ResendTransport } from "./resend-transport";

const addresses = z
  .array(z.string())
  .nullish()
  .transform((value) => value ?? []);

const ReceivedEmailSchema = z.object({
  id: z.string().min(1),
  message_id: z.string().nullish(),
  from: z.string().min(1),
  to: addresses,
  cc: addresses,
  received_for: addresses,
  subject: z.string().nullish(),
  created_at: z.string().nullish(),
  text: z.string().nullish(),
  html: z.string().nullish(),
  attachments: z
    .array(
      z.object({
        id: z.string().min(1),
        filename: z.string().nullish(),
        content_type: z.string().nullish(),
        size: z.number().int().min(0).nullish(),
      }),
    )
    .nullish()
    .transform((value) => value ?? []),
});

type ReceivedEmail = z.infer<typeof ReceivedEmailSchema>;

const toContent = ({ mail }: { mail: ReceivedEmail }): InboundMailContent => ({
  providerEmailId: mail.id,
  messageId: mail.message_id ?? null,
  from: mail.from,
  to: mail.to,
  cc: mail.cc,
  receivedFor: mail.received_for,
  subject: mail.subject ?? null,
  receivedAt: mail.created_at ?? null,
  text: mail.text ?? null,
  html: mail.html ?? null,
  attachments: mail.attachments.map(({ id, filename, content_type, size }) => ({
    id,
    filename: filename ?? null,
    contentType: content_type ?? null,
    size: size ?? null,
  })),
});

export type FetchResendInboundInput = {
  providerEmailId: string;
  apiKey: string;
  transport: ResendTransport;
};

const unavailable = ({ message, cause }: { message: string; cause?: unknown }) =>
  err({ error: appError({ code: "UNAVAILABLE", message, cause }) });

/** Loads a received mail's body and attachment metadata: `GET /emails/receiving/{id}`. */
export async function fetchResendInbound({
  providerEmailId,
  apiKey,
  transport,
}: FetchResendInboundInput): Promise<Result<InboundMailContent>> {
  try {
    const response = await transport({
      url: `${RESEND_API_URL}/emails/receiving/${encodeURIComponent(providerEmailId)}`,
      init: { method: "GET", headers: { authorization: `Bearer ${apiKey}` } },
    });
    if (!response.ok) {
      return unavailable({ message: `Resend refused the received mail (HTTP ${response.status})` });
    }
    const parsed = ReceivedEmailSchema.safeParse(await response.json());
    if (!parsed.success) return unavailable({ message: "Unexpected received mail from Resend" });
    return ok({ value: toContent({ mail: parsed.data }) });
  } catch (cause) {
    return unavailable({ message: "Fetching the received mail from Resend failed", cause });
  }
}
