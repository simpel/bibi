import { appError, err, ok, type Result } from "@okazi/core";
import { z } from "zod";
import type { MailProvider } from "../mail-provider";
import type { MailMessage, SentMail } from "../schema";
import { fetchResendInbound } from "./fetch-resend-inbound";
import { parseResendInbound } from "./parse-resend-inbound";
import { fetchTransport, RESEND_API_URL, type ResendTransport } from "./resend-transport";

export type CreateResendProviderInput = {
  apiKey: string;
  from: string;
  webhookSecret?: string;
  /** Injected in tests; defaults to the global `fetch`. */
  transport?: ResendTransport;
};

const SendResponseSchema = z.object({ id: z.string().min(1) });

function toResendBody({ message, from }: { message: MailMessage; from: string }) {
  return {
    from,
    to: [message.to],
    subject: message.subject,
    text: message.text,
    html: message.html,
    reply_to: message.replyTo,
    attachments: message.attachments?.map(({ filename, content, contentType }) => ({
      filename,
      content,
      content_type: contentType,
    })),
  };
}

type PostInput = { message: MailMessage; input: CreateResendProviderInput };

async function postEmail({ message, input }: PostInput): Promise<Result<SentMail>> {
  const { apiKey, from, transport = fetchTransport } = input;
  try {
    const response = await transport({
      url: `${RESEND_API_URL}/emails`,
      init: {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify(toResendBody({ message, from })),
      },
    });
    if (!response.ok) {
      const errorMessage = `Resend rejected the mail (HTTP ${response.status})`;
      return err({ error: appError({ code: "UNAVAILABLE", message: errorMessage }) });
    }
    const { id } = SendResponseSchema.parse(await response.json());
    return ok({ value: { providerMessageId: id } });
  } catch (cause) {
    return err({ error: appError({ code: "UNAVAILABLE", message: "Resend send failed", cause }) });
  }
}

/** Resend over its REST API (ADR 0012). Inbound arrives as a Svix-signed webhook. */
export function createResendProvider({
  apiKey,
  from,
  webhookSecret,
  transport,
}: CreateResendProviderInput): MailProvider {
  const input = { apiKey, from, webhookSecret, transport };
  return {
    name: "resend",
    send: async ({ message }) => postEmail({ message, input }),
    parseInbound: async ({ request }) => parseResendInbound({ request, webhookSecret }),
    fetchInbound: async ({ providerEmailId }) =>
      fetchResendInbound({ providerEmailId, apiKey, transport: transport ?? fetchTransport }),
  };
}
