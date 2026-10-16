import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { checkOwners } from "../booking/booking-rules";
import { InquiryAssignInputSchema, InquirySchema } from "./schema";
import { loadInquiry, toInquiryDto } from "./to-inquiry-dto";
import { OWNER_REQUIRED_STATUSES } from "./transitions";

export const assignInquiry = defineOperation({
  name: "inquiry.assign",
  kind: "command",
  description:
    "Change an inquiry's salesperson (ADR 0022). The owner must be a member of the " +
    "organization (member.list userId). null removes the owner, which is refused (CONFLICT) " +
    "once the inquiry is QUALIFIED, QUOTED or WON.",
  input: InquiryAssignInputSchema,
  output: InquirySchema,
  permission: "inquiry:write",
  handler: async ({ input: { id, salesOwnerId }, context }) => {
    const before = await loadInquiry({ context, id });
    if (!before) return notFound({ entity: "Inquiry" });
    if (salesOwnerId === null && OWNER_REQUIRED_STATUSES.includes(before.inquiryStatus)) {
      return conflict({ message: `An inquiry in ${before.inquiryStatus} requires a salesperson` });
    }
    const member = await checkOwners({ context, salesOwnerId });
    if (!member.ok) return member;
    const row = await context.db.inquiry.update({ where: { id }, data: { salesOwnerId } });
    const inquiry = toInquiryDto({ row });
    context.recordChange({ entityId: id, before, after: inquiry });
    return ok({ value: inquiry });
  },
});
