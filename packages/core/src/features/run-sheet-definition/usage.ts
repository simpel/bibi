import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";

type Db = Pick<OperationContext, "db">;

/** What a run sheet definition can refer to. Archiving any of them is refused while it is used. */
export type RunSheetReference =
  | { entityTypeId: string }
  | { fieldId: string }
  | { vocabularyId: string }
  | { responsibilityId: string };

/** An indexed `EXISTS` on the join rows (ADR 0056). */
function whereUsing({ reference }: { reference: RunSheetReference }) {
  if ("entityTypeId" in reference) return { entityTypes: { some: reference } };
  if ("fieldId" in reference) return { fields: { some: reference } };
  if ("vocabularyId" in reference) return { vocabularies: { some: reference } };
  return reference;
}

export type CheckNotOnRunSheetsInput = {
  context: Db;
  reference: RunSheetReference;
  what: string;
};

/**
 * `CONFLICT` while an active run sheet definition includes the type, field or list or goes to the
 * responsibility (ADR 0026: data exists → CONFLICT). `what` names the record in the message.
 */
export async function checkNotOnRunSheets({
  context,
  reference,
  what,
}: CheckNotOnRunSheetsInput): Promise<Result<void>> {
  const runSheets = await context.db.runSheetDefinition.findMany({
    where: whereUsing({ reference }),
    select: { name: true },
    orderBy: { name: "asc" },
  });
  if (runSheets.length === 0) return ok({ value: undefined });
  const names = runSheets.map((runSheet) => runSheet.name).join(", ");
  return conflict({ message: `${what} is used by the run sheets ${names}` });
}
