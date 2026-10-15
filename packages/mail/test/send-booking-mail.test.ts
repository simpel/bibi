import { bookingReplyAddress } from "@okazi/core";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryMailProvider, sendBookingMail, setMailProvider } from "../src/index";

afterEach(() => {
  setMailProvider({ provider: undefined });
});

const message = { to: "guest@example.test", subject: "Your booking", text: "Body" };

describe("sendBookingMail", () => {
  it("sets the booking's inbound address as reply-to", async () => {
    const memory = createMemoryMailProvider();
    setMailProvider({ provider: memory.provider });
    const inboundAddress = bookingReplyAddress({ bookingId: "abc123", domain: "in.okazi.test" });
    const result = await sendBookingMail({ ...message, booking: { inboundAddress } });
    expect(result.ok).toBe(true);
    expect(memory.outbox).toEqual([{ ...message, replyTo: "booking-abc123@in.okazi.test" }]);
  });

  it("sends without reply-to when inbound mail is not configured", async () => {
    const memory = createMemoryMailProvider();
    setMailProvider({ provider: memory.provider });
    const result = await sendBookingMail({ ...message, booking: { inboundAddress: null } });
    expect(result.ok).toBe(true);
    expect(memory.outbox).toEqual([message]);
  });
});
