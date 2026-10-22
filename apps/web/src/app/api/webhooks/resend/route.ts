import { createInboundWebhookHandler } from "@bibi/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createInboundWebhookHandler();

/** Resend's `email.received` webhook (ADR 0012): Svix-signed, no session. */
export const POST = (request: Request) => handler(request);
