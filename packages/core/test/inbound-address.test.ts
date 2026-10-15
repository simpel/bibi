import { describe, expect, it } from "vitest";
import { bookingIdFromAddress, bookingInboundAddress, bookingReplyAddress } from "../src/index";

const domain = "in.okazi.test";

describe("inbound address scheme", () => {
  it("round-trips a booking id and ignores other addresses", () => {
    const address = bookingInboundAddress({ bookingId: "abc123", domain: "In.Okazi.test" });
    expect(address).toBe("booking-abc123@in.okazi.test");
    expect(bookingIdFromAddress({ address: `Desk <${address}>`, domain })).toBe("abc123");
    expect(bookingIdFromAddress({ address: "BOOKING-ABC123@IN.OKAZI.TEST", domain })).toBe(
      "abc123",
    );
    expect(bookingIdFromAddress({ address: "booking-abc123@other.test", domain })).toBeNull();
    expect(bookingIdFromAddress({ address: "sales@in.okazi.test", domain })).toBeNull();
    expect(bookingIdFromAddress({ address: "booking-a.b@in.okazi.test", domain })).toBeNull();
  });

  it("gives no reply address without an inbound domain", () => {
    expect(bookingReplyAddress({ bookingId: "abc123", domain: undefined })).toBeNull();
    expect(bookingReplyAddress({ bookingId: "abc123", domain })).toBe(
      bookingInboundAddress({ bookingId: "abc123", domain }),
    );
  });
});
