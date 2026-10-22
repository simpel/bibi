import { getEnv } from "@bibi/config";
import {
  type AppError,
  type DeliverInboundEmailInput,
  deliverInboundEmail,
  toHttpStatus,
} from "@bibi/core";
import { withRequestLogging } from "@bibi/logger";
import { getMailProvider } from "../get-mail-provider";
import type { MailProvider } from "../mail-provider";
import { toInboundMail } from "./to-inbound-mail";

export type CreateInboundWebhookHandlerInput = {
  /** Defaults to the env-selected adapter (`MAIL_PROVIDER`). */
  provider?: MailProvider;
  /** Defaults to `MAIL_INBOUND_DOMAIN`. */
  domain?: string;
  db?: DeliverInboundEmailInput["db"];
};

const reply = ({ status, body }: { status: number; body: Record<string, unknown> }) =>
  Response.json(body, { status });

const failed = ({ error }: { error: AppError }) =>
  reply({ status: toHttpStatus({ error }), body: { error: error.code } });

type HandleInput = { request: Request; provider: MailProvider; domain: string } & Pick<
  CreateInboundWebhookHandlerInput,
  "db"
>;

async function handle({ request, provider, domain, db }: HandleInput): Promise<Response> {
  const body = await request.text();
  const event = await provider.parseInbound({ request: { headers: request.headers, body } });
  if (!event.ok) return failed({ error: event.error });
  if (!event.value) return reply({ status: 200, body: { status: "ignored" } });
  const providerEmailId = event.value.providerEmailId;
  const content = await provider.fetchInbound({ providerEmailId });
  if (!content.ok) return failed({ error: content.error });
  const mail = toInboundMail({ event: event.value, content: content.value });
  const delivered = await deliverInboundEmail({ mail, domain, ...(db ? { db } : {}) });
  if (!delivered.ok) return failed({ error: delivered.error });
  return reply({ status: 200, body: { status: delivered.value.status } });
}

/**
 * `POST` endpoint for the provider's inbound webhook (ADR 0012): verifies the signature
 * (`parseInbound`, 401 on a bad one), fetches the body (`fetchInbound`) and stores the mail on
 * the ticket its address names. Unknown addresses answer 200 so the provider stops retrying;
 * provider outages answer 503 so it retries.
 */
export function createInboundWebhookHandler({
  provider: injected,
  domain: configured,
  db,
}: CreateInboundWebhookHandlerInput = {}) {
  return withRequestLogging({
    surface: "webhook",
    handler: async (request) => {
      const domain = configured ?? getEnv().MAIL_INBOUND_DOMAIN;
      if (!domain) return reply({ status: 503, body: { error: "UNAVAILABLE" } });
      const provider = injected ?? getMailProvider();
      return handle({ request, provider, domain, db });
    },
  });
}
