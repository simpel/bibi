import { describe, expect, it } from "vitest";
import { ticketIdFromAddress, ticketInboundAddress, ticketReplyAddress } from "../src/index";

const domain = "in.okazi.test";

describe("inbound address scheme", () => {
  it("round-trips a ticket id and ignores other addresses", () => {
    const address = ticketInboundAddress({ ticketId: "abc123", domain: "In.Okazi.test" });
    expect(address).toBe("ticket-abc123@in.okazi.test");
    expect(ticketIdFromAddress({ address: `Desk <${address}>`, domain })).toBe("abc123");
    expect(ticketIdFromAddress({ address: "TICKET-ABC123@IN.OKAZI.TEST", domain })).toBe("abc123");
    expect(ticketIdFromAddress({ address: "ticket-abc123@other.test", domain })).toBeNull();
    expect(ticketIdFromAddress({ address: "sales@in.okazi.test", domain })).toBeNull();
    expect(ticketIdFromAddress({ address: "ticket-a.b@in.okazi.test", domain })).toBeNull();
  });

  it("gives no reply address without an inbound domain", () => {
    expect(ticketReplyAddress({ ticketId: "abc123", domain: undefined })).toBeNull();
    expect(ticketReplyAddress({ ticketId: "abc123", domain })).toBe(
      ticketInboundAddress({ ticketId: "abc123", domain }),
    );
  });
});
