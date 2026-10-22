import { isDeepStrictEqual } from "node:util";
import type { Ticket } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import type { SheetDefinitionDto } from "../sheet-definition/schema";
import { diffContent } from "./diff-content";
import type { SheetContent, SheetMatch } from "./schema";
import { SHEET_INCLUDE, type SheetWithRecipients, toSheetDto } from "./to-sheet-dto";

type Db = { context: Pick<OperationContext, "db" | "organizationId"> };
type Of = { ticketId: string; sheetDefinitionId: string };

/** The newest version of a ticket's sheet, and the newest one that was sent. */
export async function findVersions({ context, ticketId, sheetDefinitionId }: Db & Of) {
  const where = { ticketId, sheetDefinitionId };
  const [latest, sent] = await Promise.all([
    context.db.sheet.findFirst({
      where,
      orderBy: { version: "desc" },
      include: SHEET_INCLUDE,
    }),
    context.db.sheet.findFirst({
      where: { ...where, sentAt: { not: null } },
      orderBy: { version: "desc" },
      include: SHEET_INCLUDE,
    }),
  ]);
  return { latest, sent };
}

export type SameAsLatestInput = {
  latest: SheetWithRecipients;
  content: SheetContent;
  matches: SheetMatch[];
  definition: SheetDefinitionDto;
};

/** An unchanged ticket, matches and responsibility gives no new version. */
export const sameAsLatest = ({ latest, content, matches, definition }: SameAsLatestInput) =>
  latest.responsibilityId === definition.responsibilityId &&
  isDeepStrictEqual(latest.content, toJson({ value: content })) &&
  isDeepStrictEqual(latest.matches, toJson({ value: matches }));

export type CreateVersionInput = Db & {
  ticket: Ticket;
  definition: SheetDefinitionDto;
  content: SheetContent;
  matches: SheetMatch[];
  latest: SheetWithRecipients | null;
  sent: SheetWithRecipients | null;
};

/** The next version, with the rows marked ★ that differ from the last sent version. */
export function createVersion({
  context,
  ticket,
  definition,
  content,
  matches,
  latest,
  sent,
}: CreateVersionInput) {
  const before = sent ? toSheetDto({ row: sent }).content : null;
  return context.db.sheet.create({
    data: {
      organizationId: context.organizationId,
      ticketId: ticket.id,
      sheetDefinitionId: definition.id,
      version: (latest?.version ?? 0) + 1,
      responsibilityId: definition.responsibilityId,
      content: toJson({ value: content }) ?? {},
      changes: toJson({ value: diffContent({ before, after: content }) }) ?? [],
      matches: toJson({ value: matches }) ?? [],
      blocked: matches.some((match) => match.blocking),
      baseVersion: sent?.version ?? null,
    },
    include: SHEET_INCLUDE,
  });
}
