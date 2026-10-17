import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { checkNewAssignee } from "../assignment/assign-on-create";
import { mainAssigneeId } from "../assignment/load-assignment";
import { saveAssignee } from "../assignment/write-assignment";
import { moveInquiry } from "./move-inquiry";
import { InquiryMarkLostInputSchema, InquiryQualifyInputSchema, InquirySchema } from "./schema";
import { loadInquiry } from "./to-inquiry-dto";
import { checkTransition } from "./transitions";

export const qualifyInquiry = defineOperation({
  name: "inquiry.qualify",
  kind: "command",
  description:
    "Move an inquiry from NEW to QUALIFIED (ADR 0022). A qualified inquiry needs a main " +
    "assignee (ADR 0034): give `assigneeId` (a member, member.list userId) unless it has one. " +
    "Any other starting status is a CONFLICT.",
  input: InquiryQualifyInputSchema,
  output: InquirySchema,
  permission: "inquiry:write",
  handler: async ({ input: { id, assigneeId }, context }) => {
    const before = await loadInquiry({ context, id });
    if (!before) return notFound({ entity: "Inquiry" });
    const allowed = checkTransition({ from: before.inquiryStatus, to: "QUALIFIED" });
    if (!allowed.ok) return allowed;
    const subject = { subjectType: "INQUIRY", subjectId: id } as const;
    const current = await mainAssigneeId({ context, ...subject });
    if (!assigneeId && !current) {
      const message = "A qualified inquiry needs an assignee";
      return invalid({ message, issues: [{ path: "assigneeId", message }] });
    }
    if (assigneeId && assigneeId !== current) {
      const member = await checkNewAssignee({ context, assigneeId });
      if (!member.ok) return member;
      await saveAssignee({ context, ...subject, assigneeId });
    }
    return moveInquiry({ context, before, to: "QUALIFIED" });
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
