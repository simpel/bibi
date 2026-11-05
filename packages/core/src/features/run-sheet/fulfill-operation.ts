import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { checkReadable } from "../order/order-rules";
import { RunSheetIdInputSchema, RunSheetSchema } from "./schema";
import { RUN_SHEET_INCLUDE, toRunSheetDto } from "./to-run-sheet-dto";

export const fulfillRunSheet = defineOperation({
  name: "runSheet.fulfill",
  kind: "command",
  description:
    "Mark a run sheet version as fulfilled/done by the operational team. Only a published, unblocked " +
    "latest version can be fulfilled.",
  input: RunSheetIdInputSchema,
  output: RunSheetSchema,
  permission: "runSheet:write",
  handler: async ({ input: { id }, context }) => {
    const readable = checkReadable({ context, permission: "order:read", path: "id" });
    if (!readable.ok) return readable;
    const before = await context.db.runSheet.findFirst({
      where: { id },
      include: RUN_SHEET_INCLUDE,
    });
    if (!before) return notFound({ entity: "RunSheet" });
    if (before.fulfilledAt) {
      return conflict({ message: `Version ${before.version} is already marked as fulfilled` });
    }
    if (!before.publishedAt) {
      return conflict({
        message: "Run sheet must be published before it can be marked as fulfilled",
      });
    }
    if (before.blocked) {
      return conflict({ message: "Cannot fulfill a blocked run sheet" });
    }
    const { orderId, runSheetDefinitionId, version } = before;
    const newer = await context.db.runSheet.count({
      where: { orderId, runSheetDefinitionId, version: { gt: version } },
    });
    if (newer > 0) return conflict({ message: "A newer version exists; fulfill that one instead" });

    await context.db.runSheet.update({
      where: { id },
      data: { fulfilledAt: new Date(), fulfilledBy: context.actor.userId },
    });
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

export const unfulfillRunSheet = defineOperation({
  name: "runSheet.unfulfill",
  kind: "command",
  description: "Reopen a previously fulfilled run sheet version.",
  input: RunSheetIdInputSchema,
  output: RunSheetSchema,
  permission: "runSheet:write",
  handler: async ({ input: { id }, context }) => {
    const readable = checkReadable({ context, permission: "order:read", path: "id" });
    if (!readable.ok) return readable;
    const before = await context.db.runSheet.findFirst({
      where: { id },
      include: RUN_SHEET_INCLUDE,
    });
    if (!before) return notFound({ entity: "RunSheet" });
    if (!before.fulfilledAt) {
      return conflict({ message: `Version ${before.version} is not marked as fulfilled` });
    }
    await context.db.runSheet.update({
      where: { id },
      data: { fulfilledAt: null, fulfilledBy: null },
    });
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
