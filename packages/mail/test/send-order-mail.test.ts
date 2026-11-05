import { orderReplyAddress } from "@bibi/core/inbound-address";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryMailProvider, sendOrderMail, setMailProvider } from "../src/index";

afterEach(() => {
  setMailProvider({ provider: undefined });
});

const message = { to: "guest@example.test", subject: "Your order", text: "Body" };

describe("sendOrderMail", () => {
  it("sets the order's inbound address as reply-to", async () => {
    const memory = createMemoryMailProvider();
    setMailProvider({ provider: memory.provider });
    const inboundAddress = orderReplyAddress({ orderId: "abc123", domain: "in.bibi.test" });
    const result = await sendOrderMail({ ...message, order: { inboundAddress } });
    expect(result.ok).toBe(true);
    expect(memory.outbox).toEqual([{ ...message, replyTo: "order-abc123@in.bibi.test" }]);
  });

  it("sends without reply-to when inbound mail is not configured", async () => {
    const memory = createMemoryMailProvider();
    setMailProvider({ provider: memory.provider });
    const result = await sendOrderMail({ ...message, order: { inboundAddress: null } });
    expect(result.ok).toBe(true);
    expect(memory.outbox).toEqual([message]);
  });
});
