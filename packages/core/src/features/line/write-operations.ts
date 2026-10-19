import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { archiveRecords, updateRecord } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { checkPeriod } from "../occupancy/occupancy-rules";
import { insertLine } from "./insert-line";
import { checkPlace, placeChanged } from "./line-rules";
import { stateAfterMove } from "./line-state";
import { rederiveLine, releaseLine } from "./reserve";
import {
  LineCreateInputSchema,
  LineIdInputSchema,
  LineSchema,
  LineUpdateInputSchema,
} from "./schema";
import { loadLine, toLineDto } from "./to-line-dto";

const OCCUPY_NOTE =
  "A line with an item starts in the item type's initial state (itemState.list). With a " +
  "bookable item it holds the item for the period as its state says (SOFT holds may overlap, " +
  "HARD holds block), and a setup adds its changeover time right before a hard hold; an " +
  "overlap with another hard hold, setup time or block gives CONFLICT.";

export const createLine = defineOperation({
  name: "line.create",
  kind: "command",
  description:
    "Add a line (a row in the ticket's run schedule) of one of the organization's " +
    `line types. ${OCCUPY_NOTE}`,
  input: LineCreateInputSchema,
  output: LineSchema,
  permission: "line:write",
  handler: async ({ input, context }) => insertLine({ context, input }),
});

export const updateLine = defineOperation({
  name: "line.update",
  kind: "command",
  description:
    "Change a line: name, time, item, setup, quantity or note. Omitted properties are " +
    "unchanged; `fields` is merged by key (null clears a value). Moving it moves its " +
    `occupancy. ${OCCUPY_NOTE}`,
  input: LineUpdateInputSchema,
  output: LineSchema,
  permission: "line:write",
  handler: async ({ input: { id, fields: patch, ...data }, context }) => {
    const before = await loadLine({ context, id });
    if (!before) return notFound({ entity: "Line" });
    const itemId = data.itemId === undefined ? before.itemId : data.itemId;
    // A line that leaves its item cannot keep that item's setup.
    const setupId = data.setupId === undefined ? (itemId ? before.setupId : null) : data.setupId;
    const place = { itemId, setupId, startsAt: data.startsAt ?? before.startsAt };
    const after = { ...place, endsAt: data.endsAt ?? before.endsAt };
    for (const check of [
      checkPeriod(after),
      await checkPlace({ context, ticketId: before.ticketId, itemId, setupId }),
    ]) {
      if (!check.ok) return check;
    }
    let json: ReturnType<typeof toJson>;
    if (patch) {
      const values = mergeFields({ before: before.fields, patch });
      const checked = await validateFields({ context, entityTypeId: before.entityTypeId, values });
      if (!checked.ok) return checked;
      json = toJson({ value: checked.value });
    }
    const state = await stateAfterMove({ context, before, itemId });
    const row = await context.db.line.update({
      where: { id },
      data: { ...data, itemId, setupId, ...state, ...(json ? { fields: json } : {}) },
    });
    await updateRecord({ context, id, change: { fields: json } });
    const line = toLineDto({ row });
    context.recordChange({ entityId: id, before, after: line });
    const moved = placeChanged({ before, after }) || "stateId" in state;
    if (!moved) return ok({ value: line });
    const reserved = await rederiveLine({ context, line });
    return reserved.ok ? ok({ value: line }) : reserved;
  },
});

export const archiveLine = defineOperation({
  name: "line.archive",
  kind: "command",
  description: "Remove (archive) a line from the run schedule and release the item it occupied.",
  input: LineIdInputSchema,
  output: LineSchema,
  permission: "line:write",
  handler: async ({ input: { id }, context }) => {
    const before = await loadLine({ context, id });
    if (!before) return notFound({ entity: "Line" });
    const row = await context.db.line.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    await archiveRecords({ context, ids: [id] });
    const line = toLineDto({ row });
    context.recordChange({ entityId: id, before, after: line });
    await releaseLine({ context, id });
    return ok({ value: line });
  },
});
