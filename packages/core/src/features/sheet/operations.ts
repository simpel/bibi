import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { buildSheetContent } from "./build-content";
import { checkNotBlocked } from "./check-blocked";
import { checkPhase } from "./check-phase";
import { checkSourcesReadable } from "./check-sources-readable";
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
    "when it was sent. Filter by ticket or sheet definition.",
  input: SheetListInputSchema,
  output: SheetListOutputSchema,
  permission: "sheet:view",
  handler: async ({ input, context }) => {
    const rows = await context.db.sheet.findMany({
      where: {
        ...(input.ticketId ? { ticketId: input.ticketId } : {}),
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
  permission: "sheet:view",
  handler: async ({ input, context }) => {
    const row = await context.db.sheet.findFirst({ where: { id: input.id } });
    return row ? ok({ value: toSheetDto({ row }) }) : notFound({ entity: "Sheet" });
  },
});

export const generateSheet = defineOperation({
  name: "sheet.generate",
  kind: "command",
  description:
    "Generate the sheet of a ticket from a sheet definition (e.g. the kitchen order): a " +
    "snapshot of the ticket's items and counts that the definition includes. A changed " +
    "ticket gives the next version, with the changed rows marked ★ against the last SENT " +
    "version; an unchanged ticket returns the latest version. Sending is a separate step " +
    "(sheet.send). Needs ticket:view, program:view and item:view (the rows are copied from them).",
  input: SheetGenerateInputSchema,
  output: SheetSchema,
  permission: "sheet:create",
  handler: async ({ input: { ticketId, sheetDefinitionId }, context }) => {
    const readable = checkSourcesReadable({ context });
    if (!readable.ok) return readable;
    const sources = await loadSources({ context, ticketId, sheetDefinitionId });
    if (!sources.ok) return sources;
    const { ticket, definition } = sources.value;
    const { latest, sent } = await findVersions({ context, ticketId, sheetDefinitionId });
    const content = await buildSheetContent({ context, ticket, definition });
    const matches = await loadMatches({ context, ticketId, definition });
    if (latest && sameAsLatest({ latest, content, matches, definition })) {
      return ok({ value: toSheetDto({ row: latest }) });
    }
    const row = await createVersion({
      context,
      ticket,
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
    "baseline the next version's ★ changes are measured against. Not for a ticket in a " +
    "terminal phase (CONFLICT), only the latest version, and a version once. A blocked " +
    "sheet (`blocked`: a count matches an item that contains it, see `matches`) gives CONFLICT.",
  input: SheetIdInputSchema,
  output: SheetSchema,
  permission: "sheet:send",
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.sheet.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Sheet" });
    if (before.sentAt) return conflict({ message: `Version ${before.version} is already sent` });
    const { ticketId, sheetDefinitionId, version } = before;
    const newer = await context.db.sheet.count({
      where: { ticketId, sheetDefinitionId, version: { gt: version } },
    });
    if (newer > 0) return conflict({ message: "A newer version exists; send that one instead" });
    const unblocked = checkNotBlocked({ sheet: toSheetDto({ row: before }) });
    if (!unblocked.ok) return unblocked;
    const phase = await checkPhase({ context, ticketId });
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
