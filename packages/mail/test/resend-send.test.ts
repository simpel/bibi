import { describe, expect, it } from "vitest";
import {
  createResendProvider,
  RESEND_API_URL,
  type ResendRequest,
  type ResendTransport,
} from "../src/index";

const fakeFetch = ({ status, body }: { status: number; body: unknown }) => {
  const calls: ResendRequest[] = [];
  const transport: ResendTransport = async ({ url, init }) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status });
  };
  return { calls, transport };
};

const message = {
  to: "guest@example.test",
  subject: "Confirmation",
  text: "Plain",
  html: "<p>Rich</p>",
  replyTo: "venue@example.test",
  attachments: [{ filename: "a.pdf", content: "aGVsbG8=", contentType: "application/pdf" }],
};

describe("Resend provider: send", () => {
  it("posts the mail to the Resend API and returns its id", async () => {
    const { calls, transport } = fakeFetch({ status: 200, body: { id: "re_123" } });
    const provider = createResendProvider({
      apiKey: "re_key",
      from: "Bibi <a@bibi.test>",
      transport,
    });
    const result = await provider.send({ message });
    expect(result.ok && result.value.providerMessageId).toBe("re_123");
    expect(calls[0]?.url).toBe(`${RESEND_API_URL}/emails`);
    expect(new Headers(calls[0]?.init.headers).get("authorization")).toBe("Bearer re_key");
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      from: "Bibi <a@bibi.test>",
      to: ["guest@example.test"],
      subject: "Confirmation",
      text: "Plain",
      html: "<p>Rich</p>",
      reply_to: "venue@example.test",
      attachments: [{ filename: "a.pdf", content: "aGVsbG8=", content_type: "application/pdf" }],
    });
  });

  it("maps a rejected request to UNAVAILABLE", async () => {
    const { transport } = fakeFetch({ status: 422, body: { message: "invalid" } });
    const provider = createResendProvider({ apiKey: "re_key", from: "a@bibi.test", transport });
    const result = await provider.send({ message });
    expect(result.ok ? "OK" : result.error.code).toBe("UNAVAILABLE");
  });

  it("maps a network failure to UNAVAILABLE", async () => {
    const transport: ResendTransport = async () => {
      throw new TypeError("fetch failed");
    };
    const provider = createResendProvider({ apiKey: "re_key", from: "a@bibi.test", transport });
    const result = await provider.send({ message });
    expect(result.ok ? "OK" : result.error.code).toBe("UNAVAILABLE");
  });
});
