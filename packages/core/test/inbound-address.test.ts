import { describe, expect, it } from "vitest";
import { ticketIdFromAddress, ticketInboundAddress, ticketReplyAddress } from "../src/index";

const domain = "in.bibi.test";

describe("inbound address scheme", () => {
  it("round-trips a ticket id and ignores other addresses", () => {
    const address = ticketInboundAddress({ ticketId: "abc123", domain: "In.Bibi.test" });
    expect(address).toBe("ticket-abc123@in.bibi.test");
    expect(ticketIdFromAddress({ address: `Desk <${address}>`, domain })).toBe("abc123");
    expect(ticketIdFromAddress({ address: "TICKET-ABC123@IN.BIBI.TEST", domain })).toBe("abc123");
    expect(ticketIdFromAddress({ address: "ticket-abc123@other.test", domain })).toBeNull();
    expect(ticketIdFromAddress({ address: "sales@in.bibi.test", domain })).toBeNull();
    expect(ticketIdFromAddress({ address: "ticket-a.b@in.bibi.test", domain })).toBeNull();
  });

  it("gives no reply address without an inbound domain", () => {
    expect(ticketReplyAddress({ ticketId: "abc123", domain: undefined })).toBeNull();
    expect(ticketReplyAddress({ ticketId: "abc123", domain })).toBe(
      ticketInboundAddress({ ticketId: "abc123", domain }),
    );
  });
});
