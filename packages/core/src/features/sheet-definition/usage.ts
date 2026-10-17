import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";

type Db = Pick<OperationContext, "db">;

/** What a sheet definition can refer to. Archiving any of them is refused while it is used. */
export type SheetReference =
  | { entityTypeId: string }
  | { fieldId: string }
  | { vocabularyId: string };

function whereUsing({ reference }: { reference: SheetReference }) {
  if ("entityTypeId" in reference) return { entityTypeIds: { has: reference.entityTypeId } };
  if ("fieldId" in reference) return { fieldIds: { has: reference.fieldId } };
  return { vocabularyIds: { has: reference.vocabularyId } };
}

export type CheckNotOnSheetsInput = { context: Db; reference: SheetReference; what: string };

/**
 * `CONFLICT` while an active sheet definition includes the type, field or list (ADR 0026: data exists → CONFLICT). `what` names the record in the message.
 */
export async function checkNotOnSheets({
  context,
  reference,
  what,
}: CheckNotOnSheetsInput): Promise<Result<void>> {
  const sheets = await context.db.sheetDefinition.findMany({
    where: whereUsing({ reference }),
    select: { name: true },
    orderBy: { name: "asc" },
  });
  if (sheets.length === 0) return ok({ value: undefined });
  const names = sheets.map((sheet) => sheet.name).join(", ");
  return conflict({ message: `${what} is used by the sheets ${names}` });
}
