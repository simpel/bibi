import type { Prisma } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { InquiryDto, InquiryStatus } from "./schema";
import { toInquiryDto } from "./to-inquiry-dto";
import { checkTransition } from "./transitions";

export type MoveInquiryInput = {
  context: Pick<OperationContext, "db" | "recordChange">;
  before: InquiryDto;
  to: InquiryStatus;
  /** Other columns the move sets, e.g. the loss reason. */
  data?: Prisma.InquiryUncheckedUpdateInput;
};

/**
 * The one place an inquiry's status changes: checks the state machine (`CONFLICT` otherwise),
 * stamps `statusChangedAt` and records the change in the audit log (also when another entity's
 * command moves it, e.g. `quote.send`).
 */
export async function moveInquiry({
  context,
  before,
  to,
  data = {},
}: MoveInquiryInput): Promise<Result<InquiryDto>> {
  const allowed = checkTransition({ from: before.inquiryStatus, to });
  if (!allowed.ok) return allowed;
  const row = await context.db.inquiry.update({
    where: { id: before.id },
    data: { ...data, inquiryStatus: to, statusChangedAt: new Date() },
  });
  const inquiry = toInquiryDto({ row });
  context.recordChange({ entityType: "inquiry", entityId: before.id, before, after: inquiry });
  return ok({ value: inquiry });
}
