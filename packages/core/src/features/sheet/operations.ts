import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { buildSheetContent } from "./build-content";
import { checkNotBlocked } from "./check-blocked";
import { checkPhase } from "./check-phase";
import { loadMatches } from "./load-matches";
import { loadSources } from "./load-sources";
import {
  SheetGenerateInputSchema,
  SheetIdInputSchema,
  SheetListInputSchema,
  SheetListOutputSchema,
  SheetSchema,
} from "./schema";
import { toSheetDto } from "./to-sheet-dto";
import { createVersion, findVersions, sameAsLatest } from "./versions";

export const listSheets = defineOperation({
  name: "sheet.list",
  kind: "query",
  description:
    "List generated sheet versions (e.g. kitchen orders), newest first: version, receiving " +
    "role, the rows of the snapshot, the changes marked ★ since the last sent version and " +
    "when it was sent. Filter by booking or sheet definition.",
  input: SheetListInputSchema,
  output: SheetListOutputSchema,
  permission: "sheet:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.sheet.findMany({
      where: {
        ...(input.bookingId ? { bookingId: input.bookingId } : {}),
        ...(input.sheetDefinitionId ? { sheetDefinitionId: input.sheetDefinitionId } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = page.items.map((row) => toSheetDto({ row }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getSheet = defineOperation({
  name: "sheet.get",
  kind: "query",
  description: "Get one sheet version by id, with its rows and the changes marked ★.",
  input: SheetIdInputSchema,
  output: SheetSchema,
  permission: "sheet:read",
  handler: async ({ input, context }) => {
    const row = await context.db.sheet.findFirst({ where: { id: input.id } });
    return row ? ok({ value: toSheetDto({ row }) }) : notFound({ entity: "Sheet" });
  },
});

export const generateSheet = defineOperation({
  name: "sheet.generate",
  kind: "command",
  description:
    "Generate the sheet of a booking from a sheet definition (e.g. the kitchen order): a " +
    "snapshot of the booking's items and counts that the definition includes. A changed " +
    "booking gives the next version, with the changed rows marked ★ against the last SENT " +
    "version; an unchanged booking returns the latest version. Sending is a separate step " +
    "(sheet.send).",
  input: SheetGenerateInputSchema,
  output: SheetSchema,
  permission: "sheet:write",
  handler: async ({ input: { bookingId, sheetDefinitionId }, context }) => {
    const sources = await loadSources({ context, bookingId, sheetDefinitionId });
    if (!sources.ok) return sources;
    const { booking, definition } = sources.value;
    const { latest, sent } = await findVersions({ context, bookingId, sheetDefinitionId });
    const content = await buildSheetContent({ context, booking, definition });
    const matches = await loadMatches({ context, bookingId, definition });
    if (latest && sameAsLatest({ latest, content, matches, definition })) {
      return ok({ value: toSheetDto({ row: latest }) });
    }
    const row = await createVersion({
      context,
      booking,
      definition,
      content,
      matches,
      latest,
      sent,
    });
    const sheet = toSheetDto({ row });
    context.recordChange({ entityId: row.id, after: sheet });
    return ok({ value: sheet });
  },
});

export const sendSheet = defineOperation({
  name: "sheet.send",
  kind: "command",
  description:
    "Send a sheet version to its receiving role: marks the version as sent, which is the " +
    "baseline the next version's ★ changes are measured against. Only from the CONFIRMED " +
    "phase (TENTATIVE gives CONFLICT), only the latest version, and a version once. A blocked " +
    "sheet (`blocked`: a count matches an item that contains it, see `matches`) gives CONFLICT.",
  input: SheetIdInputSchema,
  output: SheetSchema,
  permission: "sheet:write",
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.sheet.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Sheet" });
    if (before.sentAt) return conflict({ message: `Version ${before.version} is already sent` });
    const { bookingId, sheetDefinitionId, version } = before;
    const newer = await context.db.sheet.count({
      where: { bookingId, sheetDefinitionId, version: { gt: version } },
    });
    if (newer > 0) return conflict({ message: "A newer version exists; send that one instead" });
    const unblocked = checkNotBlocked({ sheet: toSheetDto({ row: before }) });
    if (!unblocked.ok) return unblocked;
    const phase = await checkPhase({ context, bookingId });
    if (!phase.ok) return phase;
    const row = await context.db.sheet.update({
      where: { id },
      data: { sentAt: new Date(), sentBy: context.actor.userId },
    });
    const sheet = toSheetDto({ row });
    context.recordChange({ entityId: id, before: toSheetDto({ row: before }), after: sheet });
    return ok({ value: sheet });
  },
});

export const sheetOperations = [listSheets, getSheet, generateSheet, sendSheet];
