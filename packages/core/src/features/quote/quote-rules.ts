import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import type { InquiryDto } from "../inquiry/schema";
import { loadInquiry } from "../inquiry/to-inquiry-dto";
import { INQUIRY_TRANSITIONS } from "../inquiry/transitions";
import type { QuoteDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type LoadOpenInquiryInput = Db & { inquiryId: string };

/** The quote's inquiry; a WON or LOST inquiry gets no new quotes or versions (`CONFLICT`). */
export async function loadOpenInquiry({
  context,
  inquiryId,
}: LoadOpenInquiryInput): Promise<Result<InquiryDto>> {
  const inquiry = await loadInquiry({ context, id: inquiryId });
  if (!inquiry) return notFound({ entity: "Inquiry" });
  if (INQUIRY_TRANSITIONS[inquiry.inquiryStatus].length === 0) {
    return conflict({ message: `The inquiry is ${inquiry.inquiryStatus} and takes no quotes` });
  }
  return ok({ value: inquiry });
}

/** Only a DRAFT can be edited; a sent quote is changed by making a new version. */
export function checkDraft({ quote }: { quote: QuoteDto }): Result<true> {
  if (quote.quoteStatus === "DRAFT") return ok({ value: true });
  return conflict({
    message: `A ${quote.quoteStatus} quote cannot be changed; make a new version with quote.revise`,
  });
}

/** The next version number of the inquiry's quote (1 when it has none). */
export async function nextVersion({ context, inquiryId }: LoadOpenInquiryInput): Promise<number> {
  const latest = await context.db.quote.findFirst({
    where: { inquiryId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return (latest?.version ?? 0) + 1;
}
