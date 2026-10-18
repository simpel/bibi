import { ticketReplyAddress } from "@okazi/core";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryMailProvider, sendTicketMail, setMailProvider } from "../src/index";

afterEach(() => {
  setMailProvider({ provider: undefined });
});

const message = { to: "guest@example.test", subject: "Your ticket", text: "Body" };

describe("sendTicketMail", () => {
  it("sets the ticket's inbound address as reply-to", async () => {
    const memory = createMemoryMailProvider();
    setMailProvider({ provider: memory.provider });
    const inboundAddress = ticketReplyAddress({ ticketId: "abc123", domain: "in.okazi.test" });
    const result = await sendTicketMail({ ...message, ticket: { inboundAddress } });
    expect(result.ok).toBe(true);
    expect(memory.outbox).toEqual([{ ...message, replyTo: "ticket-abc123@in.okazi.test" }]);
  });

  it("sends without reply-to when inbound mail is not configured", async () => {
    const memory = createMemoryMailProvider();
    setMailProvider({ provider: memory.provider });
    const result = await sendTicketMail({ ...message, ticket: { inboundAddress: null } });
    expect(result.ok).toBe(true);
    expect(memory.outbox).toEqual([message]);
  });
});
