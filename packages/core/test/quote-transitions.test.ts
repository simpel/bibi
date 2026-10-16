import { describe, expect, it } from "vitest";
import { checkQuoteTransition, QUOTE_STATUSES, type QuoteStatus } from "../src/index";
import { errorCode } from "./helpers";

/** Every move the quote's state machine allows (ADR 0022); every other pair is a CONFLICT. */
const ALLOWED: ReadonlyArray<readonly [QuoteStatus, QuoteStatus]> = [
  ["DRAFT", "SENT"],
  ["SENT", "ACCEPTED"],
  ["SENT", "DECLINED"],
  ["SENT", "EXPIRED"],
];

const isAllowed = ({ from, to }: { from: QuoteStatus; to: QuoteStatus }) =>
  ALLOWED.some(([a, b]) => a === from && b === to);

const ALL_PAIRS = QUOTE_STATUSES.flatMap((from) => QUOTE_STATUSES.map((to) => ({ from, to })));

describe("quote transitions (ADR 0022)", () => {
  it.each(ALL_PAIRS.filter(isAllowed))("allows $from → $to", ({ from, to }) => {
    expect(checkQuoteTransition({ from, to }).ok).toBe(true);
  });

  it.each(ALL_PAIRS.filter((pair) => !isAllowed(pair)))(
    "refuses $from → $to with CONFLICT",
    ({ from, to }) => {
      expect(errorCode({ result: checkQuoteTransition({ from, to }) })).toBe("CONFLICT");
    },
  );

  it("covers all 25 pairs", () => {
    expect(ALL_PAIRS).toHaveLength(25);
    expect(ALL_PAIRS.filter(isAllowed)).toHaveLength(ALLOWED.length);
  });
});
