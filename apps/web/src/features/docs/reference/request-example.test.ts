import { describe, expect, it } from "vitest";
import { toolCallExample } from "./request-example";
import type { ReferenceEntry } from "./types";

const ENTRY: ReferenceEntry = {
  id: "booking_update",
  toolName: "booking_update",
  group: "booking",
  operation: "booking.update",
  summary: "Update a booking",
  permission: "booking:update",
  readOnly: false,
  approval: true,
  input: {
    type: "object",
    required: ["id", "startsAt"],
    properties: {
      id: { type: "string" },
      startsAt: { type: "string", format: "date-time" },
      note: { type: "string" },
    },
  },
  output: {},
};

describe("toolCallExample", () => {
  it("builds a JSON-RPC tools/call request with only the required arguments", () => {
    const call = JSON.parse(toolCallExample({ entry: ENTRY }));
    expect(call.method).toBe("tools/call");
    expect(call.params).toEqual({
      name: "booking_update",
      arguments: { id: "string", startsAt: "2026-11-05T09:00:00.000Z" },
    });
  });
});
