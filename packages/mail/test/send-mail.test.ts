import { appError, err } from "@okazi/core";
import { type CapturedLogs, captureLogs } from "@okazi/logger";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createMemoryMailProvider,
  type MailProvider,
  sendMail,
  setMailProvider,
} from "../src/index";

let logs: CapturedLogs;
beforeEach(() => {
  logs = captureLogs();
});
afterEach(() => {
  setMailProvider({ provider: undefined });
  logs.restore();
});

const message = { to: "guest@example.test", subject: "Hello", text: "Body" };

describe("sendMail", () => {
  it("sends through the installed provider and logs mail.sent with a masked recipient", async () => {
    const memory = createMemoryMailProvider();
    setMailProvider({ provider: memory.provider });
    const result = await sendMail(message);
    expect(result.ok).toBe(true);
    expect(memory.outbox).toEqual([message]);
    const [entry] = logs.events({ event: "mail.sent" });
    expect(entry).toMatchObject({
      provider: "memory",
      recipient: "***@example.test",
      subject: "Hello",
    });
    expect(JSON.stringify(entry)).not.toContain("guest@");
  });

  it("returns the provider error and logs mail.failed", async () => {
    const failing: MailProvider = {
      ...createMemoryMailProvider().provider,
      send: async () => err({ error: appError({ code: "UNAVAILABLE", message: "down" }) }),
    };
    setMailProvider({ provider: failing });
    const result = await sendMail(message);
    expect(result.ok ? "OK" : result.error.code).toBe("UNAVAILABLE");
    expect(logs.events({ event: "mail.failed" })).toHaveLength(1);
  });

  it("rejects an invalid message before reaching the provider", async () => {
    const memory = createMemoryMailProvider();
    setMailProvider({ provider: memory.provider });
    const result = await sendMail({ ...message, to: "not-an-email" });
    expect(result.ok ? "OK" : result.error.code).toBe("VALIDATION");
    expect(memory.outbox).toHaveLength(0);
  });
});
