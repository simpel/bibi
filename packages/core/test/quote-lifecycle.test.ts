import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import {
  declineQuote,
  execute,
  expireQuote,
  getInquiry,
  getQuote,
  reviseQuote,
  sendQuote,
  updateQuote,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestInquiry } from "./inquiry-helpers";
import { createTestQuote, quoteSetup } from "./quote-helpers";

async function draft() {
  const setup = await quoteSetup();
  const lines = [{ itemId: setup.lunch.id, quantity: 20 }];
  const quote = await createTestQuote({
    context: setup.context,
    inquiryId: setup.inquiry.id,
    lines,
  });
  return { ...setup, quote };
}

describe("quote.send (ADR 0022)", () => {
  it("needs lines and a future validity, then sends and moves the inquiry to QUOTED", async () => {
    const { context, inquiry, quote } = await draft();
    const { id } = quote;
    const past = new Date(Date.now() - 1000);
    unwrap({
      result: await execute({ operation: updateQuote, input: { id, validUntil: past }, context }),
    });
    const expired = await execute({ operation: sendQuote, input: { id }, context });
    expect(errorCode({ result: expired })).toBe("VALIDATION");
    const empty = await execute({ operation: updateQuote, input: { id, lines: [] }, context });
    const noLines = await execute({ operation: sendQuote, input: { id }, context });
    expect(unwrap({ result: empty }).totalInclVatMinor).toBe(0);
    expect(errorCode({ result: noLines })).toBe("VALIDATION");
    const validUntil = new Date(Date.now() + 86_400_000);
    const lines = [{ itemId: quote.lines[0]?.itemId ?? "", quantity: 5 }];
    unwrap({
      result: await execute({ operation: updateQuote, input: { id, validUntil, lines }, context }),
    });
    const sent = unwrap({
      result: await execute({ operation: sendQuote, input: { id }, context }),
    });
    expect(sent).toMatchObject({ quoteStatus: "SENT" });
    const after = unwrap({
      result: await execute({ operation: getInquiry, input: { id: inquiry.id }, context }),
    });
    expect(after.inquiryStatus).toBe("QUOTED");
    const twice = await execute({ operation: sendQuote, input: { id }, context });
    expect(errorCode({ result: twice })).toBe("CONFLICT");
    const edit = await execute({ operation: updateQuote, input: { id, terms: "x" }, context });
    expect(errorCode({ result: edit })).toBe("CONFLICT");
    const audit = await getDb().auditLog.findMany({ where: { entityId: inquiry.id } });
    expect(audit.find((row) => row.operation === "quote.send")?.entityType).toBe("inquiry");
  });

  it("refuses a NEW inquiry and rolls everything back", async () => {
    const { context, type, customer, lunch } = await quoteSetup();
    const fresh = await createTestInquiry({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const lines = [{ itemId: lunch.id, quantity: 1 }];
    const quote = await createTestQuote({ context, inquiryId: fresh.id, lines });
    const sent = await execute({ operation: sendQuote, input: { id: quote.id }, context });
    expect(errorCode({ result: sent })).toBe("CONFLICT");
    const kept = unwrap({
      result: await execute({ operation: getQuote, input: { id: quote.id }, context }),
    });
    expect(kept.quoteStatus).toBe("DRAFT");
  });
});

describe("quote.decline and quote.expire (ADR 0022)", () => {
  it("close only a SENT quote", async () => {
    const { context, quote } = await draft();
    const { id } = quote;
    for (const operation of [declineQuote, expireQuote]) {
      const early = await execute({ operation, input: { id }, context });
      expect(errorCode({ result: early })).toBe("CONFLICT");
    }
    unwrap({ result: await execute({ operation: sendQuote, input: { id }, context }) });
    const declined = unwrap({
      result: await execute({ operation: declineQuote, input: { id }, context }),
    });
    expect(declined.quoteStatus).toBe("DECLINED");
    const late = await execute({ operation: expireQuote, input: { id }, context });
    expect(errorCode({ result: late })).toBe("CONFLICT");
  });
});

describe("quote.revise (ADR 0022)", () => {
  it("copies the latest version into a marked DRAFT and supersedes it on send", async () => {
    const { context, quote, coffee } = await draft();
    const draftRevise = await execute({ operation: reviseQuote, input: { id: quote.id }, context });
    expect(errorCode({ result: draftRevise })).toBe("CONFLICT");
    unwrap({ result: await execute({ operation: sendQuote, input: { id: quote.id }, context }) });
    const v2 = unwrap({
      result: await execute({ operation: reviseQuote, input: { id: quote.id }, context }),
    });
    expect(v2).toMatchObject({ version: 2, previousId: quote.id, quoteStatus: "DRAFT" });
    expect(v2.lines.map((line) => line.change)).toEqual(["UNCHANGED"]);
    const older = await execute({ operation: reviseQuote, input: { id: quote.id }, context });
    expect(errorCode({ result: older })).toBe("CONFLICT");
    const lines = [
      { itemId: coffee.id, quantity: 20 },
      { lineId: v2.lines[0]?.id, itemId: v2.lines[0]?.itemId ?? "", quantity: 25 },
    ];
    const edited = unwrap({
      result: await execute({ operation: updateQuote, input: { id: v2.id, lines }, context }),
    });
    expect(edited.lines.map((line) => [line.change, line.changedFields])).toEqual([
      ["ADDED", []],
      ["CHANGED", ["quantity"]],
    ]);
    unwrap({ result: await execute({ operation: sendQuote, input: { id: v2.id }, context }) });
    const v1 = unwrap({
      result: await execute({ operation: getQuote, input: { id: quote.id }, context }),
    });
    expect(v1.quoteStatus).toBe("EXPIRED");
  });

  it("lists the lines a version removed", async () => {
    const { context, quote } = await draft();
    unwrap({ result: await execute({ operation: sendQuote, input: { id: quote.id }, context }) });
    unwrap({
      result: await execute({ operation: declineQuote, input: { id: quote.id }, context }),
    });
    const v2 = unwrap({
      result: await execute({ operation: reviseQuote, input: { id: quote.id }, context }),
    });
    const emptied = unwrap({
      result: await execute({ operation: updateQuote, input: { id: v2.id, lines: [] }, context }),
    });
    expect(emptied.removedLines.map((line) => line.name)).toEqual(["Lunch"]);
  });
});
