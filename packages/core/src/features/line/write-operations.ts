import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { insertLine } from "./insert-line";
import { archiveLineRow, archiveParts } from "./line-parts";
import {
  LineCreateInputSchema,
  LineIdInputSchema,
  LineSchema,
  LineUpdateInputSchema,
} from "./schema";
import { loadLine } from "./to-line-record";
import { updateLineRow } from "./update-line";
import { effectiveHandler } from "./with-effective";

const OCCUPY_NOTE =
  "A line with an item starts in the item type's initial state (itemState.list). With a " +
  "bookable item it holds the item for the period as its state says (SOFT holds may overlap, " +
  "HARD holds block), with setup and teardown buffers of the same kind right before and after " +
  "(setupMinutes and teardownMinutes, else the item's, else its type's; the setup's changeover " +
  "time is the least setup); an overlap with another hard hold, buffer or block gives CONFLICT.";

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
    "releases its hold. Moving it moves its occupancy, and moving a bundle line moves its part " +
    "lines by the same delta (a bundle line with parts keeps its item, ADR 0059). " +
    OCCUPY_NOTE,
  input: LineUpdateInputSchema,
  output: LineSchema,
  permission: "program:write",
  handler: effectiveHandler({ handler: ({ input, context }) => updateLineRow({ context, input }) }),
});

export const archiveLine = defineOperation({
  name: "line.archive",
  kind: "command",
  description:
    "Remove (archive) a line from the run schedule and release the item it occupied; removing " +
    "a bundle line removes its part lines too (ADR 0059).",
  input: LineIdInputSchema,
  output: LineSchema,
  permission: "program:delete",
  handler: effectiveHandler({
    handler: async ({ input: { id }, context }) => {
      const before = await loadLine({ context, id });
      if (!before) return notFound({ entity: "Line" });
      const line = await archiveLineRow({ context, before });
      await archiveParts({ context, before });
      return ok({ value: line });
    },
  }),
});
