import { describe, expect, it } from "vitest";
import { checkPhaseRules } from "../src/features/booking/phase-rules";
import type { BookingPhase } from "../src/features/booking-status/schema";
import { errorCode } from "./helpers";

const now = new Date(Date.UTC(2026, 10, 1, 12));
const ended = new Date(Date.UTC(2026, 10, 1, 11));
const upcoming = new Date(Date.UTC(2026, 10, 1, 13));

type Row = {
  phase: BookingPhase;
  assignee: boolean;
  endsAt: Date;
  reason?: string;
  expected: string | null;
};

/** Every phase rule of ADR 0022, both sides of each condition. */
const table: Row[] = [
  { phase: "TENTATIVE", assignee: false, endsAt: upcoming, expected: null },
  { phase: "TENTATIVE", assignee: true, endsAt: ended, expected: null },
  { phase: "CONFIRMED", assignee: false, endsAt: upcoming, expected: "CONFLICT" },
  { phase: "CONFIRMED", assignee: true, endsAt: upcoming, expected: null },
  { phase: "CONFIRMED", assignee: true, endsAt: ended, expected: null },
  { phase: "COMPLETED", assignee: true, endsAt: upcoming, expected: "CONFLICT" },
  { phase: "COMPLETED", assignee: false, endsAt: ended, expected: "CONFLICT" },
  { phase: "COMPLETED", assignee: true, endsAt: now, expected: null },
  { phase: "COMPLETED", assignee: true, endsAt: ended, expected: null },
  { phase: "CANCELLED", assignee: false, endsAt: upcoming, expected: "VALIDATION" },
  { phase: "CANCELLED", assignee: true, endsAt: ended, expected: "VALIDATION" },
  { phase: "CANCELLED", assignee: false, endsAt: upcoming, reason: "Moved", expected: null },
  { phase: "CANCELLED", assignee: true, endsAt: ended, reason: "Moved", expected: null },
];

describe("booking phase rules (ADR 0022)", () => {
  it.each(table)(
    "$phase assignee=$assignee endsAt=$endsAt reason=$reason → $expected",
    ({ phase, assignee, endsAt, reason, expected }) => {
      const result = checkPhaseRules({
        booking: { endsAt },
        assigneeId: assignee ? "user_1" : null,
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
      booking: { endsAt: upcoming },
      assigneeId: null,
      phase: "CANCELLED",
      statusName: "Cancelled",
      now,
    });
    expect(result.ok ? null : result.error.issues[0]?.path).toBe("reason");
  });
});
