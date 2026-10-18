import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { checkPeriod } from "../occupancy/occupancy-rules";
import { insertProgramItem } from "./insert-program-item";
import { checkPlace, placeChanged } from "./program-item-rules";
import { releaseProgramItem, reserveProgramItem } from "./reserve";
import {
  ProgramItemCreateInputSchema,
  ProgramItemIdInputSchema,
  ProgramItemSchema,
  ProgramItemUpdateInputSchema,
} from "./schema";
import { loadProgramItem, toProgramItemDto } from "./to-program-item-dto";

const OCCUPY_NOTE =
  "With a bookable item it occupies the item for the period, and a setup adds its changeover " +
  "time right before; an overlap with another booking, setup time or block gives CONFLICT.";

export const createProgramItem = defineOperation({
  name: "programItem.create",
  kind: "command",
  description:
    "Add a program item (a row in the ticket's run schedule) of one of the organization's " +
    `program item types. ${OCCUPY_NOTE}`,
  input: ProgramItemCreateInputSchema,
  output: ProgramItemSchema,
  permission: "programItem:write",
  handler: async ({ input, context }) => insertProgramItem({ context, input }),
});

export const updateProgramItem = defineOperation({
  name: "programItem.update",
  kind: "command",
  description:
    "Change a program item: name, time, item, setup, quantity or note. Omitted properties are " +
    "unchanged; `fields` is merged by key (null clears a value). Moving it moves its " +
    `occupancy. ${OCCUPY_NOTE}`,
  input: ProgramItemUpdateInputSchema,
  output: ProgramItemSchema,
  permission: "programItem:write",
  handler: async ({ input: { id, fields: patch, ...data }, context }) => {
    const before = await loadProgramItem({ context, id });
    if (!before) return notFound({ entity: "Program item" });
    const itemId = data.itemId === undefined ? before.itemId : data.itemId;
    // A program item that leaves its item cannot keep that item's setup.
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
    const row = await context.db.programItem.update({
      where: { id },
      data: { ...data, itemId, setupId, ...(json ? { fields: json } : {}) },
    });
    const programItem = toProgramItemDto({ row });
    context.recordChange({ entityId: id, before, after: programItem });
    if (!placeChanged({ before, after })) return ok({ value: programItem });
    await releaseProgramItem({ context, id });
    const reserved = await reserveProgramItem({ context, programItem });
    return reserved.ok ? ok({ value: programItem }) : reserved;
  },
});

export const archiveProgramItem = defineOperation({
  name: "programItem.archive",
  kind: "command",
  description:
    "Remove (archive) a program item from the run schedule and release the item it occupied.",
  input: ProgramItemIdInputSchema,
  output: ProgramItemSchema,
  permission: "programItem:write",
  handler: async ({ input: { id }, context }) => {
    const before = await loadProgramItem({ context, id });
    if (!before) return notFound({ entity: "Program item" });
    const row = await context.db.programItem.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    const programItem = toProgramItemDto({ row });
    context.recordChange({ entityId: id, before, after: programItem });
    await releaseProgramItem({ context, id });
    return ok({ value: programItem });
  },
});
