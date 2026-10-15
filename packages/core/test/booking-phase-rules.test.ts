import { describe, expect, it } from "vitest";
import { checkPhaseRules } from "../src/features/booking/phase-rules";
import type { BookingPhase } from "../src/features/booking-status/schema";
import { errorCode } from "./helpers";

const now = new Date(Date.UTC(2026, 10, 1, 12));
const ended = new Date(Date.UTC(2026, 10, 1, 11));
const upcoming = new Date(Date.UTC(2026, 10, 1, 13));

type Row = {
  phase: BookingPhase;
  coordinator: boolean;
  endsAt: Date;
  reason?: string;
  expected: string | null;
};

/** Every phase rule of ADR 0022, both sides of each condition. */
const table: Row[] = [
  { phase: "TENTATIVE", coordinator: false, endsAt: upcoming, expected: null },
  { phase: "TENTATIVE", coordinator: true, endsAt: ended, expected: null },
  { phase: "CONFIRMED", coordinator: false, endsAt: upcoming, expected: "CONFLICT" },
  { phase: "CONFIRMED", coordinator: true, endsAt: upcoming, expected: null },
  { phase: "CONFIRMED", coordinator: true, endsAt: ended, expected: null },
  { phase: "COMPLETED", coordinator: true, endsAt: upcoming, expected: "CONFLICT" },
  { phase: "COMPLETED", coordinator: false, endsAt: ended, expected: "CONFLICT" },
  { phase: "COMPLETED", coordinator: true, endsAt: now, expected: null },
  { phase: "COMPLETED", coordinator: true, endsAt: ended, expected: null },
  { phase: "CANCELLED", coordinator: false, endsAt: upcoming, expected: "VALIDATION" },
  { phase: "CANCELLED", coordinator: true, endsAt: ended, expected: "VALIDATION" },
  { phase: "CANCELLED", coordinator: false, endsAt: upcoming, reason: "Moved", expected: null },
  { phase: "CANCELLED", coordinator: true, endsAt: ended, reason: "Moved", expected: null },
];

describe("booking phase rules (ADR 0022)", () => {
  it.each(table)(
    "$phase coordinator=$coordinator endsAt=$endsAt reason=$reason → $expected",
    ({ phase, coordinator, endsAt, reason, expected }) => {
      const result = checkPhaseRules({
        booking: { coordinatorId: coordinator ? "user_1" : null, endsAt },
        phase,
        statusName: "Status",
        reason,
        now,
      });
      expect(errorCode({ result })).toBe(expected);
    },
  );

  it("points a missing cancellation reason at the reason field", () => {
    const result = checkPhaseRules({
      booking: { coordinatorId: null, endsAt: upcoming },
      phase: "CANCELLED",
      statusName: "Cancelled",
      now,
    });
    expect(result.ok ? null : result.error.issues[0]?.path).toBe("reason");
  });
});
