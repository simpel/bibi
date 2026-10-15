import { describe, expect, it } from "vitest";
import { checkTransition, INQUIRY_STATUSES, type InquiryStatus } from "../src/index";
import { errorCode } from "./helpers";

/** Every move the state machine allows (ADR 0022); every other pair is a CONFLICT. */
const ALLOWED: ReadonlyArray<readonly [InquiryStatus, InquiryStatus]> = [
  ["NEW", "QUALIFIED"],
  ["NEW", "LOST"],
  ["QUALIFIED", "QUOTED"],
  ["QUALIFIED", "LOST"],
  ["QUOTED", "WON"],
  ["QUOTED", "LOST"],
];

const isAllowed = ({ from, to }: { from: InquiryStatus; to: InquiryStatus }) =>
  ALLOWED.some(([a, b]) => a === from && b === to);

const ALL_PAIRS = INQUIRY_STATUSES.flatMap((from) => INQUIRY_STATUSES.map((to) => ({ from, to })));

describe("inquiry transitions (ADR 0022)", () => {
  it.each(ALL_PAIRS.filter(isAllowed))("allows $from → $to", ({ from, to }) => {
    expect(checkTransition({ from, to }).ok).toBe(true);
  });

  it.each(ALL_PAIRS.filter((pair) => !isAllowed(pair)))(
    "refuses $from → $to with CONFLICT",
    ({ from, to }) => {
      expect(errorCode({ result: checkTransition({ from, to }) })).toBe("CONFLICT");
    },
  );

  it("covers all 25 pairs", () => {
    expect(ALL_PAIRS).toHaveLength(25);
    expect(ALL_PAIRS.filter(isAllowed)).toHaveLength(ALLOWED.length);
  });
});
