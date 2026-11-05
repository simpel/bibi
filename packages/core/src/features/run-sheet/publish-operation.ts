import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { notifyRunSheetSent } from "../notification/follow-ups";
import { checkReadable } from "../order/order-rules";
import { checkNotBlocked } from "./check-blocked";
import { checkStatus } from "./check-status";
import { RunSheetIdInputSchema, RunSheetSchema } from "./schema";
import { currentRecipients, storeRecipients } from "./snapshot-recipients";
import { toRunSheetDto, RUN_SHEET_INCLUDE } from "./to-run-sheet-dto";

export const publishRunSheet = defineOperation({
  name: "runSheet.publish",
  kind: "command",
  description:
    "Publish a run sheet version to its receiving responsibility: marks the version as published, which is the " +
    "baseline the next version's ★ changes are measured against. Not for an order in a " +
    "closing status (CONFLICT), only the latest version, and a version once. A blocked " +
    "run sheet (`blocked`: a count matches an item that contains it, see `matches`) gives CONFLICT. " +
    "Needs `order:read`: the recipients (the responsibility's assignee and followers on " +
    "the order) are stored as a snapshot that later changes do not rewrite.",
  input: RunSheetIdInputSchema,
  output: RunSheetSchema,
  permission: "runSheet:write",
  followUp: notifyRunSheetSent,
  handler: async ({ input: { id }, context }) => {
    const readable = checkReadable({ context, permission: "order:read", path: "id" });
    if (!readable.ok) return readable;
    const before = await context.db.runSheet.findFirst({
      where: { id },
      include: RUN_SHEET_INCLUDE,
    });
    if (!before) return notFound({ entity: "RunSheet" });
    if (before.publishedAt)
      return conflict({ message: `Version ${before.version} is already published` });
    const { orderId, runSheetDefinitionId, version, responsibilityId } = before;
    const newer = await context.db.runSheet.count({
      where: { orderId, runSheetDefinitionId, version: { gt: version } },
    });
    if (newer > 0) return conflict({ message: "A newer version exists; publish that one instead" });
    const unblocked = checkNotBlocked({ runSheet: toRunSheetDto({ row: before }) });
    if (!unblocked.ok) return unblocked;
    const orderStatus = await checkStatus({ context, orderId });
    if (!orderStatus.ok) return orderStatus;
    const recipients = await currentRecipients({ context, orderId, responsibilityId });
    await context.db.runSheet.update({
      where: { id },
      data: { publishedAt: new Date(), publishedBy: context.actor.userId },
    });
    await storeRecipients({ context, runSheetId: id, recipients });
    const row = await context.db.runSheet.findFirstOrThrow({
      where: { id },
      include: RUN_SHEET_INCLUDE,
    });
    const runSheet = toRunSheetDto({ row });
    context.recordChange({
      entityId: id,
      before: toRunSheetDto({ row: before }),
      after: runSheet,
    });
    return ok({ value: runSheet });
  },
});

/** Compatibility alias for sendRunSheet. */
export const sendRunSheet = publishRunSheet;
