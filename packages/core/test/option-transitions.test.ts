import { describe, expect, it } from "vitest";
import { checkOptionTransition, OPTION_STATUSES, type OptionStatus } from "../src/index";
import { errorCode } from "./helpers";

/** Every move the option's state machine allows (ADR 0022); every other pair is a CONFLICT. */
const ALLOWED: ReadonlyArray<readonly [OptionStatus, OptionStatus]> = [
  ["ACTIVE", "CONVERTED"],
  ["ACTIVE", "EXPIRED"],
  ["ACTIVE", "RELEASED"],
];

const isAllowed = ({ from, to }: { from: OptionStatus; to: OptionStatus }) =>
  ALLOWED.some(([a, b]) => a === from && b === to);

const ALL_PAIRS = OPTION_STATUSES.flatMap((from) => OPTION_STATUSES.map((to) => ({ from, to })));

describe("option transitions (ADR 0022)", () => {
  it.each(ALL_PAIRS.filter(isAllowed))("allows $from → $to", ({ from, to }) => {
    expect(checkOptionTransition({ from, to }).ok).toBe(true);
  });

  it.each(ALL_PAIRS.filter((pair) => !isAllowed(pair)))(
    "refuses $from → $to with CONFLICT",
    ({ from, to }) => {
      expect(errorCode({ result: checkOptionTransition({ from, to }) })).toBe("CONFLICT");
    },
  );

  it("covers all 16 pairs", () => {
    expect(ALL_PAIRS).toHaveLength(16);
    expect(ALL_PAIRS.filter(isAllowed)).toHaveLength(ALLOWED.length);
  });
});
