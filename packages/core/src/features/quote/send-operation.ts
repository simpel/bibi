import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import { moveInquiry } from "../inquiry/move-inquiry";
import type { InquiryDto } from "../inquiry/schema";
import { moveQuote } from "./move-quote";
import { loadOpenInquiry } from "./quote-rules";
import { type QuoteDto, QuoteIdInputSchema, QuoteSchema } from "./schema";
import { loadQuote } from "./to-quote-dto";
import { checkQuoteTransition } from "./transitions";

type Context = Pick<OperationContext, "db" | "recordChange">;

/** A quote is sent with at least one line and a validity date that has not passed. */
function checkSendable({ quote }: { quote: QuoteDto }): Result<true> {
  if (quote.lines.length === 0) {
    const message = "A quote needs at least one line to be sent";
    return invalid({ message, issues: [{ path: "lines", message }] });
  }
  if (!quote.validUntil || quote.validUntil <= new Date()) {
    const message = "A quote needs a validity date in the future to be sent";
    return invalid({ message, issues: [{ path: "validUntil", message }] });
  }
  return ok({ value: true });
}

type SupersedeInput = { context: Context; inquiry: InquiryDto; quote: QuoteDto };

/** Moves the inquiry to QUOTED (from QUALIFIED) and expires its older SENT versions. */
async function supersede({ context, inquiry, quote }: SupersedeInput): Promise<Result<true>> {
  if (inquiry.inquiryStatus !== "QUOTED") {
    const moved = await moveInquiry({ context, before: inquiry, to: "QUOTED" });
    if (!moved.ok) return moved;
  }
  const older = await context.db.quote.findMany({
    where: { inquiryId: quote.inquiryId, quoteStatus: "SENT", id: { not: quote.id } },
    select: { id: true },
  });
  for (const { id } of older) {
    const before = await loadQuote({ context, id });
    if (!before) continue;
    const expired = await moveQuote({ context, before, to: "EXPIRED" });
    if (!expired.ok) return expired;
  }
  return ok({ value: true });
}

export const sendQuote = defineOperation({
  name: "quote.send",
  kind: "command",
  description:
    "Mark a DRAFT quote as SENT to the customer (ADR 0022). It needs at least one line and a " +
    "future `validUntil`. The inquiry moves to QUOTED (it must be QUALIFIED or already QUOTED, " +
    "otherwise CONFLICT) and older SENT versions of the quote expire. Any other starting " +
    "status is a CONFLICT.",
  input: QuoteIdInputSchema,
  output: QuoteSchema,
  permission: "quote:write",
  handler: async ({ input: { id }, context }) => {
    const before = await loadQuote({ context, id });
    if (!before) return notFound({ entity: "Quote" });
    for (const check of [
      checkQuoteTransition({ from: before.quoteStatus, to: "SENT" }),
      checkSendable({ quote: before }),
    ]) {
      if (!check.ok) return check;
    }
    const inquiry = await loadOpenInquiry({ context, inquiryId: before.inquiryId });
    if (!inquiry.ok) return inquiry;
    const superseded = await supersede({ context, inquiry: inquiry.value, quote: before });
    if (!superseded.ok) return superseded;
    return moveQuote({ context, before, to: "SENT" });
  },
});
