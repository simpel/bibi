import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";

type Db = Pick<OperationContext, "db">;

/** What a sheet definition can refer to. Archiving any of them is refused while it is used. */
export type SheetReference =
  | { entityTypeId: string }
  | { fieldId: string }
  | { vocabularyId: string }
  | { responsibilityId: string };

/** An indexed `EXISTS` on the join rows (ADR 0056). */
function whereUsing({ reference }: { reference: SheetReference }) {
  if ("entityTypeId" in reference) return { entityTypes: { some: reference } };
  if ("fieldId" in reference) return { fields: { some: reference } };
  if ("vocabularyId" in reference) return { vocabularies: { some: reference } };
  return reference;
}

export type CheckNotOnSheetsInput = { context: Db; reference: SheetReference; what: string };

/**
 * `CONFLICT` while an active sheet definition includes the type, field or list or goes to the
 * responsibility (ADR 0026: data exists → CONFLICT). `what` names the record in the message.
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
