import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { checkOwners } from "../booking/booking-rules";
import { moveInquiry } from "./move-inquiry";
import { InquiryMarkLostInputSchema, InquiryQualifyInputSchema, InquirySchema } from "./schema";
import { loadInquiry } from "./to-inquiry-dto";
import { checkTransition } from "./transitions";

export const qualifyInquiry = defineOperation({
  name: "inquiry.qualify",
  kind: "command",
  description:
    "Move an inquiry from NEW to QUALIFIED (ADR 0022). A qualified inquiry needs a salesperson: " +
    "give `salesOwnerId` (a member, member.list userId) unless the inquiry already has one. " +
    "Any other starting status is a CONFLICT.",
  input: InquiryQualifyInputSchema,
  output: InquirySchema,
  permission: "inquiry:write",
  handler: async ({ input: { id, salesOwnerId }, context }) => {
    const before = await loadInquiry({ context, id });
    if (!before) return notFound({ entity: "Inquiry" });
    const allowed = checkTransition({ from: before.inquiryStatus, to: "QUALIFIED" });
    if (!allowed.ok) return allowed;
    const owner = salesOwnerId ?? before.salesOwnerId;
    if (!owner) {
      const message = "A qualified inquiry needs a salesperson";
      return invalid({ message, issues: [{ path: "salesOwnerId", message }] });
    }
    const member = await checkOwners({ context, salesOwnerId: owner });
    if (!member.ok) return member;
    return moveInquiry({ context, before, to: "QUALIFIED", data: { salesOwnerId: owner } });
  },
});

export const markInquiryLost = defineOperation({
  name: "inquiry.markLost",
  kind: "command",
  description:
    "Mark an open inquiry (NEW, QUALIFIED or QUOTED) as LOST with a reason (ADR 0022). A WON " +
    "or LOST inquiry cannot be marked lost (CONFLICT).",
  input: InquiryMarkLostInputSchema,
  output: InquirySchema,
  permission: "inquiry:write",
  handler: async ({ input: { id, lossReason }, context }) => {
    const before = await loadInquiry({ context, id });
    if (!before) return notFound({ entity: "Inquiry" });
    return moveInquiry({ context, before, to: "LOST", data: { lossReason } });
  },
});
