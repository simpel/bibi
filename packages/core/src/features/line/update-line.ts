import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { LinkValue } from "../../records/record-links";
import { updateRecord } from "../../records/update-record";
import { conflict, notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { groupHardHoldBlocker } from "../alternative-group/hard-hold";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { syncAllocations } from "../line-allocation/sync-allocations";
import { moveWithState } from "./item-state-move";
import { checkBundleItem, moveParts } from "./line-parts";
import { checkLinePeriod, checkPlace } from "./line-rules";
import { stateAfterMove } from "./line-state";
import type { LineRecord, LineUpdateInput } from "./schema";
import { loadLine, toLineRecord } from "./to-line-record";

type UpdateLineInput = { context: OperationContext; input: LineUpdateInput };

type FieldsPatchInput = {
  context: OperationContext;
  before: LineRecord;
  patch: LineUpdateInput["fields"];
};

/** The merged and validated field values, or nothing to write when no fields were given. */
async function fieldsPatch({ context, before, patch }: FieldsPatchInput) {
  if (!patch) return ok({ value: { json: undefined, links: undefined } });
  const values = mergeFields({ before: before.fields, patch });
  const checked = await validateFields({ context, entityTypeId: before.entityTypeId, values });
  if (!checked.ok) return checked;
  const json: ReturnType<typeof toJson> = toJson({ value: checked.value.fields });
  const links: LinkValue[] | undefined = checked.value.links;
  return ok({ value: { json, links } });
}

/** The line's place and time after the change; omitted values keep the line's own. */
function placeAfter({ before, data }: { before: LineRecord; data: Omit<LineUpdateInput, "id"> }) {
  const itemId = data.itemId === undefined ? before.itemId : data.itemId;
  // A line that leaves its item cannot keep that item's setup.
  const setupId = data.setupId === undefined ? (itemId ? before.setupId : null) : data.setupId;
  const startsAt = data.startsAt === undefined ? before.startsAt : data.startsAt;
  const endsAt = data.endsAt === undefined ? before.endsAt : data.endsAt;
  return { itemId, setupId, startsAt, endsAt };
}

/**
 * `line.update`: checks and writes the change, moves the line's state when its item type changes
 * and moves a bundle line's parts with it (ADR 0059). Holds follow by trigger (ADR 0053).
 */
export async function updateLineRow({
  context,
  input,
}: UpdateLineInput): Promise<Result<LineRecord>> {
  const { id, fields: patch, ...data } = input;
  const before = await loadLine({ context, id });
  if (!before) return notFound({ entity: "Line" });
  const after = placeAfter({ before, data });
  for (const check of [
    checkLinePeriod(after),
    await checkPlace({ context, ticketId: before.ticketId, ...after }),
    await checkBundleItem({ context, lineId: id, before, itemId: after.itemId }),
  ]) {
    if (!check.ok) return check;
  }
  const fields = await fieldsPatch({ context, before, patch });
  if (!fields.ok) return fields;
  const { json, links } = fields.value;
  const state = await stateAfterMove({ context, before, itemId: after.itemId });
  const stateId = state?.stateId ?? null;
  const grouped = await groupHardHoldBlocker({ context, line: before, stateId, lock: true });
  if (grouped) return conflict({ message: grouped.message, issues: [grouped] });
  await updateRecord({ context, id, change: { fields: json, links } });
  const reset = state ? { stateOverridden: false } : {};
  const write = () =>
    context.db.line.update({
      where: { id },
      data: { ...data, ...after, ...reset, ...(json ? { fields: json } : {}) },
    });
  const fromStateId = before.stateId;
  const row = await moveWithState({ context, lineId: id, fromStateId, state, write });
  const line = toLineRecord({ row });
  context.recordChange({ entityId: id, before, after: line });
  await moveParts({ context, before, after });
  const allocated = await syncAllocations({ context, lineId: id });
  return allocated.ok ? ok({ value: line }) : allocated;
}
