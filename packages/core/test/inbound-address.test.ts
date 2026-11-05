import { describe, expect, it } from "vitest";
import {
  orderIdFromAddress,
  orderInboundAddress,
  orderReplyAddress,
} from "../src/features/inbound-email/address";

const domain = "in.bibi.test";

describe("inbound address scheme", () => {
  it("round-trips an order id and ignores other addresses", () => {
    const address = orderInboundAddress({ orderId: "abc123", domain: "In.Bibi.test" });
    expect(address).toBe("order-abc123@in.bibi.test");
    expect(orderIdFromAddress({ address: `Desk <${address}>`, domain })).toBe("abc123");
    expect(orderIdFromAddress({ address: "ORDER-ABC123@IN.BIBI.TEST", domain })).toBe("abc123");
    expect(orderIdFromAddress({ address: "order-abc123@other.test", domain })).toBeNull();
    expect(orderIdFromAddress({ address: "sales@in.bibi.test", domain })).toBeNull();
    expect(orderIdFromAddress({ address: "order-a.b@in.bibi.test", domain })).toBeNull();
  });

  it("gives no reply address without an inbound domain", () => {
    expect(orderReplyAddress({ orderId: "abc123", domain: undefined })).toBeNull();
    expect(orderReplyAddress({ orderId: "abc123", domain })).toBe(
      orderInboundAddress({ orderId: "abc123", domain }),
    );
  });
});
