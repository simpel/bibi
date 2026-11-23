import { describe, expect, it } from "vitest";
import { runSheetsNeedSending } from "./needs-sending";

const sent = { blocked: false, publishedAt: new Date(), baseVersion: null, fulfilledAt: null };

describe("runSheetsNeedSending", () => {
  it("is quiet when every run sheet is sent or done, or there are none", () => {
    expect(runSheetsNeedSending({ runSheets: [] })).toBe(false);
    expect(runSheetsNeedSending({ runSheets: [sent, { ...sent, fulfilledAt: new Date() }] })).toBe(
      false,
    );
  });

  it("marks a draft, a changed one and a blocked one", () => {
    const draft = { ...sent, publishedAt: null };
    expect(runSheetsNeedSending({ runSheets: [sent, draft] })).toBe(true);
    expect(runSheetsNeedSending({ runSheets: [{ ...draft, baseVersion: 1 }] })).toBe(true);
    expect(runSheetsNeedSending({ runSheets: [{ ...sent, blocked: true }] })).toBe(true);
  });
});
