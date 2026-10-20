import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { LinkValue } from "../../records/record-links";
import { archiveRecords, updateRecord } from "../../records/update-record";
import { conflict, notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { groupHardHoldBlocker } from "../alternative-group/hard-hold";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { insertLine } from "./insert-line";
import { moveWithState } from "./item-state-move";
import { checkLinePeriod, checkPlace } from "./line-rules";
import { stateAfterMove } from "./line-state";
import {
  LineCreateInputSchema,
  LineIdInputSchema,
  LineSchema,
  LineUpdateInputSchema,
} from "./schema";
import { LINE_INCLUDE, loadLine, toLineRecord } from "./to-line-record";
import { effectiveHandler } from "./with-effective";

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
  permission: "program:write",
  handler: effectiveHandler({ handler: ({ input, context }) => insertLine({ context, input }) }),
});

export const updateLine = defineOperation({
  name: "line.update",
  kind: "command",
  description:
    "Change a line: name, time, item, setup, quantity, price, discount, VAT or note. Omitted " +
    "properties are unchanged and null clears an override (the line inherits again); `fields` " +
    "is merged by key (null clears a value). Clearing both times makes the line untimed, which " +
    "releases its hold. Moving it moves its " +
    `occupancy. ${OCCUPY_NOTE}`,
  input: LineUpdateInputSchema,
  output: LineSchema,
  permission: "program:write",
  handler: effectiveHandler({
    handler: async ({ input: { id, fields: patch, ...data }, context }) => {
      const before = await loadLine({ context, id });
      if (!before) return notFound({ entity: "Line" });
      const itemId = data.itemId === undefined ? before.itemId : data.itemId;
      // A line that leaves its item cannot keep that item's setup.
      const setupId = data.setupId === undefined ? (itemId ? before.setupId : null) : data.setupId;
      const startsAt = data.startsAt === undefined ? before.startsAt : data.startsAt;
      const endsAt = data.endsAt === undefined ? before.endsAt : data.endsAt;
      const after = { itemId, setupId, startsAt, endsAt };
      for (const check of [
        checkLinePeriod(after),
        await checkPlace({ context, ticketId: before.ticketId, itemId, setupId }),
      ]) {
        if (!check.ok) return check;
      }
      let json: ReturnType<typeof toJson>;
      let links: LinkValue[] | undefined;
      if (patch) {
        const values = mergeFields({ before: before.fields, patch });
        const checked = await validateFields({
          context,
          entityTypeId: before.entityTypeId,
          values,
        });
        if (!checked.ok) return checked;
        json = toJson({ value: checked.value.fields });
        links = checked.value.links;
      }
      const state = await stateAfterMove({ context, before, itemId });
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
      // The hold follows by trigger (ADR 0053); an overlap fails the update with CONFLICT.
      return ok({ value: line });
    },
  }),
});

export const archiveLine = defineOperation({
  name: "line.archive",
  kind: "command",
  description: "Remove (archive) a line from the run schedule and release the item it occupied.",
  input: LineIdInputSchema,
  output: LineSchema,
  permission: "program:delete",
  handler: effectiveHandler({
    handler: async ({ input: { id }, context }) => {
      const before = await loadLine({ context, id });
      if (!before) return notFound({ entity: "Line" });
      const row = await context.db.line.update({
        where: { id },
        data: { status: "ARCHIVED" },
        include: LINE_INCLUDE,
      });
      await archiveRecords({ context, ids: [id] });
      const line = toLineRecord({ row });
      context.recordChange({ entityId: id, before, after: line });
      return ok({ value: line });
    },
  }),
});
