import type { FieldDefinition } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { FieldSpec } from "./fields-schema";

export type LoadFieldSpecsInput = { context: Pick<OperationContext, "db">; entityTypeId: string };

export type ToFieldSpecInput = { field: FieldDefinition; valueIds: readonly string[] };

/** A list-backed choice field allows the list's active value ids; inline fields their options. */
export const toFieldSpec = ({ field, valueIds }: ToFieldSpecInput): FieldSpec => ({
  key: field.key,
  name: field.name,
  kind: field.kind,
  required: field.required,
  choices: field.vocabularyId ? valueIds : field.options.length > 0 ? field.options : null,
});

/** The value specs of a type's active fields, with list values resolved. */
export async function loadFieldSpecs({
  context,
  entityTypeId,
}: LoadFieldSpecsInput): Promise<FieldSpec[]> {
  const fields = await context.db.fieldDefinition.findMany({
    where: { entityTypeId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });
  const listIds = fields.flatMap((field) => (field.vocabularyId ? [field.vocabularyId] : []));
  const values = await context.db.vocabularyValue.findMany({
    where: { vocabularyId: { in: listIds } },
    select: { id: true, vocabularyId: true },
  });
  return fields.map((field) =>
    toFieldSpec({
      field,
      valueIds: values.filter((v) => v.vocabularyId === field.vocabularyId).map((v) => v.id),
    }),
  );
}
