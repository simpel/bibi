import { describe, expect, it } from "vitest";
import { createResendProvider, signSvixPayload } from "../src/index";

const secret = `whsec_${Buffer.from("test-signing-secret").toString("base64")}`;
const provider = createResendProvider({
  apiKey: "re_key",
  from: "a@bibi.test",
  webhookSecret: secret,
});

const received = {
  type: "email.received",
  created_at: "2026-10-15T10:00:00.000Z",
  data: {
    email_id: "56761188-7520-42d8-8898-ff6fc54ce618",
    created_at: "2026-10-15T10:00:00.000Z",
    message_id: "<111@example.test>",
    from: "Guest <guest@example.test>",
    to: ["ticket-abc@in.bibi.test"],
    subject: "Re: your ticket",
  },
};

type SignedInput = { payload: unknown; timestamp?: number; signWith?: string };

const signed = ({
  payload,
  timestamp = Math.floor(Date.now() / 1000),
  signWith = secret,
}: SignedInput) => {
  const body = JSON.stringify(payload);
  const id = "msg_1";
  const signature = signSvixPayload({ id, timestamp: String(timestamp), body, secret: signWith });
  const headers = new Headers({
    "svix-id": id,
    "svix-timestamp": String(timestamp),
    "svix-signature": `v1,${signature}`,
  });
  return { headers, body };
};

const codeOf = ({ result }: { result: { ok: boolean; error?: { code: string } } }) =>
  result.ok ? "OK" : result.error?.code;

describe("Resend provider: parseInbound", () => {
  it("parses a signed email.received event into inbound metadata", async () => {
    const result = await provider.parseInbound({ request: signed({ payload: received }) });
    expect(result.ok && result.value).toEqual({
      providerEmailId: received.data.email_id,
      messageId: "<111@example.test>",
      from: "Guest <guest@example.test>",
      to: ["ticket-abc@in.bibi.test"],
      subject: "Re: your ticket",
      receivedAt: "2026-10-15T10:00:00.000Z",
    });
  });

  it("ignores other event types", async () => {
    const payload = { type: "email.delivered", data: {} };
    const result = await provider.parseInbound({ request: signed({ payload }) });
    expect(result.ok && result.value).toBeNull();
  });

  it("rejects a wrong signature", async () => {
    const forged = `whsec_${Buffer.from("other").toString("base64")}`;
    const result = await provider.parseInbound({
      request: signed({ payload: received, signWith: forged }),
    });
    expect(codeOf({ result })).toBe("UNAUTHENTICATED");
  });

  it("rejects a stale timestamp", async () => {
    const timestamp = Math.floor(Date.now() / 1000) - 60 * 60;
    const result = await provider.parseInbound({
      request: signed({ payload: received, timestamp }),
    });
    expect(codeOf({ result })).toBe("UNAUTHENTICATED");
  });

  it("rejects a tampered body", async () => {
    const request = signed({ payload: received });
    const result = await provider.parseInbound({
      request: { headers: request.headers, body: request.body.replace("Guest", "Mallory") },
    });
    expect(codeOf({ result })).toBe("UNAUTHENTICATED");
  });

  it("rejects a malformed email.received payload", async () => {
    const payload = { type: "email.received", data: { email_id: "x" } };
    const result = await provider.parseInbound({ request: signed({ payload }) });
    expect(codeOf({ result })).toBe("VALIDATION");
  });

  it("is unavailable without a webhook secret", async () => {
    const unsigned = createResendProvider({ apiKey: "re_key", from: "a@bibi.test" });
    const result = await unsigned.parseInbound({ request: signed({ payload: received }) });
    expect(codeOf({ result })).toBe("UNAVAILABLE");
  });
});
