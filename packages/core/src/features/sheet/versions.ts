import { isDeepStrictEqual } from "node:util";
import type { Booking, Sheet } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import type { SheetDefinitionDto } from "../sheet-definition/schema";
import { diffContent } from "./diff-content";
import type { SheetContent } from "./schema";
import { toSheetDto } from "./to-sheet-dto";

type Db = { context: Pick<OperationContext, "db" | "organizationId"> };
type Of = { bookingId: string; sheetDefinitionId: string };

/** The newest version of a booking's sheet, and the newest one that was sent. */
export async function findVersions({ context, bookingId, sheetDefinitionId }: Db & Of) {
  const where = { bookingId, sheetDefinitionId };
  const [latest, sent] = await Promise.all([
    context.db.sheet.findFirst({ where, orderBy: { version: "desc" } }),
    context.db.sheet.findFirst({
      where: { ...where, sentAt: { not: null } },
      orderBy: { version: "desc" },
    }),
  ]);
  return { latest, sent };
}

export type SameAsLatestInput = {
  latest: Sheet;
  content: SheetContent;
  definition: SheetDefinitionDto;
};

/** An unchanged booking and role gives no new version. */
export const sameAsLatest = ({ latest, content, definition }: SameAsLatestInput) =>
  latest.roleId === definition.roleId &&
  isDeepStrictEqual(latest.content, toJson({ value: content }));

export type CreateVersionInput = Db & {
  booking: Booking;
  definition: SheetDefinitionDto;
  content: SheetContent;
  latest: Sheet | null;
  sent: Sheet | null;
};

/** The next version, with the rows marked ★ that differ from the last sent version. */
export function createVersion({
  context,
  booking,
  definition,
  content,
  latest,
  sent,
}: CreateVersionInput) {
  const before = sent ? toSheetDto({ row: sent }).content : null;
  return context.db.sheet.create({
    data: {
      organizationId: context.organizationId,
      bookingId: booking.id,
      sheetDefinitionId: definition.id,
      version: (latest?.version ?? 0) + 1,
      roleId: definition.roleId,
      content: toJson({ value: content }) ?? {},
      changes: toJson({ value: diffContent({ before, after: content }) }) ?? [],
      baseVersion: sent?.version ?? null,
    },
  });
}
