import { bookingInboundAddress, execute, listInboundEmails } from "@okazi/core";
import { describe, expect, it } from "vitest";
import {
  createInboundWebhookHandler,
  createResendProvider,
  type ResendTransport,
  signSvixPayload,
} from "../src/index";
import { bookingFixture } from "./booking-fixture";

const domain = "in.okazi.test";
const secret = `whsec_${Buffer.from("inbound-test-secret").toString("base64")}`;

/** Resend's API answering `GET /emails/receiving/{id}` with the fetched mail. */
const resendApi =
  ({ to }: { to: string }): ResendTransport =>
  async ({ url }) => {
    const id = url.split("/").at(-1);
    const mail = {
      id,
      from: "Guest <guest@example.test>",
      to: [to],
      cc: [],
      received_for: [to],
      subject: "Re: your booking",
      text: "We will be 40 guests.",
      html: "<p>We will be 40 guests.</p>",
      message_id: "<111@example.test>",
      created_at: "2026-10-15T10:00:00.000Z",
      attachments: [
        { id: "att_1", filename: "menu.pdf", content_type: "application/pdf", size: 9 },
      ],
    };
    return Response.json(mail);
  };

type SignedInput = { to: string; emailId: string; signWith?: string };

/** A webhook request exactly as Resend delivers `email.received` (Svix-signed). */
function signedRequest({ to, emailId, signWith = secret }: SignedInput): Request {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = JSON.stringify({
    type: "email.received",
    created_at: "2026-10-15T10:00:00.000Z",
    data: { email_id: emailId, from: "Guest <guest@example.test>", to: [to], subject: "Re" },
  });
  const signature = signSvixPayload({ id: "msg_1", timestamp, body, secret: signWith });
  const headers = {
    "svix-id": "msg_1",
    "svix-timestamp": timestamp,
    "svix-signature": `v1,${signature}`,
  };
  return new Request("http://localhost/api/webhooks/resend", { method: "POST", headers, body });
}

const handlerFor = ({ to }: { to: string }) =>
  createInboundWebhookHandler({
    domain,
    provider: createResendProvider({
      apiKey: "re_key",
      from: "a@okazi.test",
      webhookSecret: secret,
      transport: resendApi({ to }),
    }),
  });

describe("inbound webhook", () => {
  it("saves a signed reply on the booking its address names", async () => {
    const { context, bookingId } = await bookingFixture();
    const to = bookingInboundAddress({ bookingId, domain });
    const response = await handlerFor({ to })(signedRequest({ to, emailId: `email_${bookingId}` }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "stored" });
    const result = await execute({ operation: listInboundEmails, input: { bookingId }, context });
    const items = result.ok ? result.value.items : [];
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      organizationId: context.organizationId,
      bookingId,
      text: "We will be 40 guests.",
      attachments: [{ id: "att_1", filename: "menu.pdf" }],
    });
  });

  it("rejects an invalid signature and stores nothing", async () => {
    const { context, bookingId } = await bookingFixture();
    const to = bookingInboundAddress({ bookingId, domain });
    const forged = `whsec_${Buffer.from("forged").toString("base64")}`;
    const request = signedRequest({ to, emailId: `email_${bookingId}`, signWith: forged });
    const response = await handlerFor({ to })(request);
    expect(response.status).toBe(401);
    const result = await execute({ operation: listInboundEmails, input: { bookingId }, context });
    expect(result.ok && result.value.items).toEqual([]);
  });

  it("acknowledges mail to an unknown address without storing it", async () => {
    const to = `booking-unknown@${domain}`;
    const response = await handlerFor({ to })(signedRequest({ to, emailId: "email_unknown" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "unmatched" });
  });

  it("answers 503 while no inbound domain is configured", async () => {
    const handler = createInboundWebhookHandler({ domain: "" });
    const response = await handler(signedRequest({ to: "x@y.test", emailId: "e" }));
    expect(response.status).toBe(503);
  });
});
