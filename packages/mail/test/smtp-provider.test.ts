import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createSmtpProvider } from "../src/index";
import { type FakeSmtpServer, startFakeSmtpServer } from "./fake-smtp-server";

let server: FakeSmtpServer;
beforeAll(async () => {
  server = await startFakeSmtpServer();
});
afterAll(() => server.close());

describe("SMTP provider", () => {
  it("delivers text, html and attachments over SMTP", async () => {
    const provider = createSmtpProvider({ url: server.url, from: "Okazi <no-reply@okazi.test>" });
    const result = await provider.send({
      message: {
        to: "guest@example.test",
        subject: "Kitchen sheet",
        text: "Plain body",
        html: "<p>Rich body</p>",
        attachments: [{ filename: "sheet.txt", content: Buffer.from("hello").toString("base64") }],
      },
    });
    expect(result.ok).toBe(true);
    const raw = server.received.at(-1) ?? "";
    expect(raw).toContain("Subject: Kitchen sheet");
    expect(raw).toContain("To: guest@example.test");
    expect(raw).toContain("<p>Rich body</p>");
    expect(raw).toContain("filename=sheet.txt");
    expect(raw).toContain(Buffer.from("hello").toString("base64"));
  });

  it("returns UNAVAILABLE when the server cannot be reached", async () => {
    const provider = createSmtpProvider({ url: "smtp://127.0.0.1:1", from: "a@okazi.test" });
    const result = await provider.send({
      message: { to: "guest@example.test", subject: "Hi", text: "Body" },
    });
    expect(result.ok ? "OK" : result.error.code).toBe("UNAVAILABLE");
  });

  it("does not support inbound mail", async () => {
    const provider = createSmtpProvider({ url: server.url, from: "a@okazi.test" });
    const result = await provider.parseInbound({ request: { headers: new Headers(), body: "{}" } });
    expect(result.ok ? "OK" : result.error.code).toBe("UNAVAILABLE");
  });
});
