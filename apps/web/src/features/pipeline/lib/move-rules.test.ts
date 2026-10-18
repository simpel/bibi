import type { PipelineCard, PipelineColumn } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { canMoveCard } from "./move-rules";

const column = ({ ...overrides }: Partial<PipelineColumn>): PipelineColumn => ({
  id: "c",
  kind: "BOOKING",
  title: "C",
  color: null,
  inquiryStatus: null,
  bookingStatusId: null,
  phase: null,
  closed: false,
  ...overrides,
});
type CardInput = { kind: PipelineCard["kind"] };
const card = ({ kind }: CardInput): PipelineCard => ({
  id: "x",
  kind,
  columnId: "c",
  reference: null,
  typeName: "T",
  customerName: "Cu",
  startsAt: null,
  endsAt: null,
  quantity: null,
  assigneeId: null,
});

describe("canMoveCard", () => {
  const tentative = column({ id: "booking:a", bookingStatusId: "a" });
  const confirmed = column({ id: "booking:b", bookingStatusId: "b" });
  const cancelled = column({ id: "booking:c", bookingStatusId: "c", closed: true });
  const transitions = { a: ["b", "c"], b: [] };

  it("follows the organization's booking transitions", () => {
    const input = { card: card({ kind: "BOOKING" }), transitions };
    expect(canMoveCard({ ...input, from: tentative, to: confirmed })).toBe(true);
    expect(canMoveCard({ ...input, from: confirmed, to: tentative })).toBe(false);
  });

  it("never accepts drops on closed lanes or the same lane", () => {
    const input = { card: card({ kind: "BOOKING" }), transitions };
    expect(canMoveCard({ ...input, from: tentative, to: cancelled })).toBe(false);
    expect(canMoveCard({ ...input, from: tentative, to: tentative })).toBe(false);
  });

  it("moves inquiries only from NEW to QUALIFIED", () => {
    const input = { card: card({ kind: "INQUIRY" }), transitions };
    const stage = ({ status }: { status: PipelineColumn["inquiryStatus"] }) =>
      column({ id: `inquiry:${status}`, kind: "INQUIRY", inquiryStatus: status });
    expect(
      canMoveCard({ ...input, from: stage({ status: "NEW" }), to: stage({ status: "QUALIFIED" }) }),
    ).toBe(true);
    expect(
      canMoveCard({
        ...input,
        from: stage({ status: "QUALIFIED" }),
        to: stage({ status: "QUOTED" }),
      }),
    ).toBe(false);
    expect(canMoveCard({ ...input, from: stage({ status: "NEW" }), to: confirmed })).toBe(false);
  });
});
