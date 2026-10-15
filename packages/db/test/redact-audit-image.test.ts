import { describe, expect, it } from "vitest";
import { REDACTED, redactAuditImage } from "../src/audit-log/redact-audit-image";

describe("redactAuditImage (ADR 0032)", () => {
  it("redacts personal keys at any depth and keeps the rest", () => {
    const value = {
      id: "b1",
      reference: 7,
      startsAt: "2025-01-01T10:00:00.000Z",
      statusReason: "Anna is ill",
      fields: { organizer: "Anna Svensson" },
      customer: { id: "c1", email: "anna@example.com", phone: "+4670000000" },
      payments: [{ amountMinor: 1000, email: "x@example.com" }],
    };
    expect(redactAuditImage({ value, entityType: "booking" })).toEqual({
      id: "b1",
      reference: 7,
      startsAt: "2025-01-01T10:00:00.000Z",
      statusReason: REDACTED,
      fields: REDACTED,
      customer: { id: "c1", email: REDACTED, phone: REDACTED },
      payments: [{ amountMinor: 1000, email: REDACTED }],
    });
  });

  it("redacts the name only on entity types that describe a person", () => {
    const value = { id: "x", name: "Anna Svensson" };
    expect(redactAuditImage({ value, entityType: "contact" })).toEqual({ id: "x", name: REDACTED });
    expect(redactAuditImage({ value, entityType: "venue" })).toEqual(value);
  });

  it("leaves null values, scalars and null images alone", () => {
    expect(redactAuditImage({ value: { email: null }, entityType: null })).toEqual({ email: null });
    expect(redactAuditImage({ value: null, entityType: "customer" })).toBeNull();
    expect(redactAuditImage({ value: "text", entityType: null })).toBe("text");
  });
});
