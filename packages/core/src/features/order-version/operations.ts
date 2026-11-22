import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { FollowUpInput, OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { regenerateRunSheets } from "../run-sheet/regenerate";
import { loadOrderContent } from "./content";
import { loadVersion, loadVersionLines, VERSION_SELECT } from "./load-versions";
import { restoreVersion } from "./restore";
import {
  type OrderVersionDetail,
  OrderVersionDetailSchema,
  OrderVersionIdInputSchema,
  OrderVersionListInputSchema,
  OrderVersionListSchema,
  OrderVersionNameInputSchema,
} from "./schema";
import { toVersionDetail, toVersionDto } from "./to-version-dto";

type DetailInput = { context: OperationContext; id: string };

/** The version with its lines and its changes against the order now. */
async function versionDetail({ context, id }: DetailInput) {
  const row = await loadVersion({ context, id });
  if (!row) return notFound({ entity: "OrderVersion" });
  const now = await loadOrderContent({ context, orderId: row.orderId });
  if (!now) return notFound({ entity: "OrderVersion" });
  const lines = (await loadVersionLines({ context, versionIds: [id] })).get(id) ?? [];
  return ok({ value: toVersionDetail({ context, row, lines, now }) });
}

const VERSION_NOTE =
  "A version is the order's content at one moment (ADR 0116): its lines (with sub-lines, item, " +
  "time, quantity, price overrides, note and fields) and headcounts, never its status, line " +
  "states or payments. One is captured automatically after every change; edits by one person " +
  "within 30 minutes collapse into one version unless it is named, restored or sent as a quote.";

export const listOrderVersions = defineOperation({
  name: "orderVersion.list",
  kind: "query",
  description:
    `The order's versions, newest first. ${VERSION_NOTE} Each says whether it equals the order ` +
    "now (isCurrent), how many changes the order has against it, and the quotes sent as it " +
    "(with quote:read).",
  input: OrderVersionListInputSchema,
  output: OrderVersionListSchema,
  permission: "program:read",
  handler: async ({ input: { orderId }, context }) => {
    const now = await loadOrderContent({ context, orderId });
    if (!now) return notFound({ entity: "Order" });
    const rows = await context.db.orderVersion.findMany({
      where: { orderId },
      orderBy: { number: "desc" },
      select: VERSION_SELECT,
    });
    const lines = await loadVersionLines({ context, versionIds: rows.map((row) => row.id) });
    const items = rows.map((row) =>
      toVersionDto({ context, row, lines: lines.get(row.id) ?? [], now }),
    );
    return ok({ value: { items } });
  },
});

export const getOrderVersion = defineOperation({
  name: "orderVersion.get",
  kind: "query",
  description:
    `One version with its lines and how the order now differs from it: lines added since, ` +
    `lines it had that were removed, lines changed (with the properties) and headcounts. ` +
    `Restoring it undoes exactly these changes. ${VERSION_NOTE}`,
  input: OrderVersionIdInputSchema,
  output: OrderVersionDetailSchema,
  permission: "program:read",
  handler: ({ input: { id }, context }) => versionDetail({ context, id }),
});

export const nameOrderVersion = defineOperation({
  name: "orderVersion.name",
  kind: "command",
  description:
    "Name a version, e.g. Without the boat, so it is easy to find and never collapses into " +
    "later edits; null removes the name. Name the newest version to keep the order as it is now.",
  input: OrderVersionNameInputSchema,
  output: OrderVersionDetailSchema,
  permission: "program:write",
  handler: async ({ input: { id, name }, context }) => {
    const before = await loadVersion({ context, id });
    if (!before) return notFound({ entity: "OrderVersion" });
    await context.db.orderVersion.update({ where: { id }, data: { name } });
    const detail = await versionDetail({ context, id });
    if (!detail.ok) return detail;
    context.recordChange({ entityId: id, before, after: { ...before, name } });
    return detail;
  },
});

/** `followUp`: the restored order's run sheets follow its lines (ADR 0092). */
async function regenerateRestored({ output, context }: FollowUpInput<unknown, OrderVersionDetail>) {
  await regenerateRunSheets({ context, orderId: output.orderId });
}

export const restoreOrderVersion = defineOperation({
  name: "orderVersion.restore",
  kind: "command",
  description:
    "Restore the order to a version (ADR 0116): lines added since are removed, lines it had " +
    "come back with their ids (in the state the status grid gives a new line), every line's " +
    "content and the headcounts are set back. The result is a new version (restoredFromId); " +
    "history is kept. A clash with another order's hard hold is CONFLICT and nothing changes. " +
    "Needs program:write, program:delete to remove lines and order:write for headcounts. " +
    "Returns the new version.",
  input: OrderVersionIdInputSchema,
  output: OrderVersionDetailSchema,
  permission: "program:write",
  followUp: regenerateRestored,
  handler: async ({ input: { id }, context }) => {
    const row = await loadVersion({ context, id });
    if (!row) return notFound({ entity: "OrderVersion" });
    const lines = (await loadVersionLines({ context, versionIds: [id] })).get(id) ?? [];
    const restored = await restoreVersion({ context, version: { ...row, lines } });
    if (!restored.ok) return restored;
    const detail = await versionDetail({ context, id: restored.value.id });
    if (detail.ok) context.recordChange({ entityId: detail.value.id, after: detail.value });
    return detail;
  },
});

export const orderVersionOperations = [
  listOrderVersions,
  getOrderVersion,
  nameOrderVersion,
  restoreOrderVersion,
];
