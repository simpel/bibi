import { describe, expect, it } from "vitest";
import {
  createMemoryMailProvider,
  createResendProvider,
  RESEND_API_URL,
  type ResendRequest,
} from "../src/index";

const emailId = "4ef9a417-02e9-4d39-ad75-9611e0fcc33c";

const received = {
  object: "email",
  id: emailId,
  to: ["ticket-abc@in.bibi.test"],
  from: "Guest <guest@example.test>",
  created_at: "2026-10-15T10:00:00.000Z",
  subject: "Re: your ticket",
  html: "<p>Hi</p>",
  text: null,
  cc: [],
  bcc: [],
  reply_to: [],
  received_for: ["ticket-abc@in.bibi.test"],
  message_id: "<111@example.test>",
  attachments: [
    { id: "att_1", filename: "menu.pdf", content_type: "application/pdf", size: 13264 },
  ],
};

const providerWith = ({ status, body }: { status: number; body: unknown }) => {
  const calls: ResendRequest[] = [];
  const provider = createResendProvider({
    apiKey: "re_key",
    from: "a@bibi.test",
    transport: async ({ url, init }) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(body), { status });
    },
  });
  return { provider, calls };
};

describe("Resend provider: fetchInbound", () => {
  it("loads the body and attachment metadata of a received mail", async () => {
    const { provider, calls } = providerWith({ status: 200, body: received });
    const result = await provider.fetchInbound({ providerEmailId: emailId });
    expect(calls[0]?.url).toBe(`${RESEND_API_URL}/emails/receiving/${emailId}`);
    expect(new Headers(calls[0]?.init.headers).get("authorization")).toBe("Bearer re_key");
    expect(result.ok && result.value).toEqual({
      providerEmailId: emailId,
      messageId: "<111@example.test>",
      from: "Guest <guest@example.test>",
      to: ["ticket-abc@in.bibi.test"],
      cc: [],
      receivedFor: ["ticket-abc@in.bibi.test"],
      subject: "Re: your ticket",
      receivedAt: "2026-10-15T10:00:00.000Z",
      text: null,
      html: "<p>Hi</p>",
      attachments: [
        { id: "att_1", filename: "menu.pdf", contentType: "application/pdf", size: 13264 },
      ],
    });
  });

  it("is unavailable when Resend refuses or answers garbage", async () => {
    const refused = await providerWith({ status: 404, body: {} }).provider.fetchInbound({
      providerEmailId: emailId,
    });
    expect(!refused.ok && refused.error.code).toBe("UNAVAILABLE");
    const garbage = await providerWith({ status: 200, body: { nope: true } }).provider.fetchInbound(
      {
        providerEmailId: emailId,
      },
    );
    expect(!garbage.ok && garbage.error.code).toBe("UNAVAILABLE");
  });

  it("is unsupported by the memory provider", async () => {
    const result = await createMemoryMailProvider().provider.fetchInbound({ providerEmailId: "x" });
    expect(!result.ok && result.error.code).toBe("UNAVAILABLE");
  });
});
