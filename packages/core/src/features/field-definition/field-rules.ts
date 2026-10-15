import type { FieldDefinition } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { type FieldKind, isChoiceKind } from "./field-kinds";
import { containsChoice, fieldValuesOfType } from "./field-usage";

type Db = Pick<OperationContext, "db">;

export type ChoiceSource = { kind: FieldKind; vocabularyId: string | null; options: string[] };

export type CheckChoiceSourceInput = { context: Db; source: ChoiceSource };

/** Choice fields take exactly one source (list or inline options); other kinds take none. */
export async function checkChoiceSource({
  context,
  source: { kind, vocabularyId, options },
}: CheckChoiceSourceInput): Promise<Result<true>> {
  const choice = isChoiceKind({ kind });
  const sources = (vocabularyId ? 1 : 0) + (options.length > 0 ? 1 : 0);
  if (choice && sources !== 1) {
    const message = "A choice field needs either a list (vocabularyId) or options";
    return invalid({ message, issues: [{ path: "vocabularyId", message }] });
  }
  if (!choice && sources > 0) {
    const message = `A ${kind} field has no list or options`;
    return invalid({ message, issues: [{ path: "kind", message }] });
  }
  if (vocabularyId && !(await context.db.vocabulary.findFirst({ where: { id: vocabularyId } }))) {
    const message = "Unknown list";
    return invalid({ message, issues: [{ path: "vocabularyId", message }] });
  }
  return ok({ value: true });
}

export type CheckFieldChangeInput = {
  context: Db;
  before: FieldDefinition;
  next: ChoiceSource & { required: boolean; linkTypeId: string | null };
};

/**
 * "Data present → CONFLICT" for a field (ADR 0021): the kind, list or link target cannot change and inline
 * options cannot be removed while records use them, and a field cannot become required while
 * records lack a value.
 */
export async function checkFieldChange({
  context,
  before,
  next,
}: CheckFieldChangeInput): Promise<Result<true>> {
  const all = await fieldValuesOfType({ context, entityTypeId: before.entityTypeId });
  const values = all.map((fields) => fields[before.key]);
  const present = values.filter((value) => value !== undefined);
  const reshaped =
    next.kind !== before.kind ||
    next.vocabularyId !== before.vocabularyId ||
    next.linkTypeId !== before.linkTypeId;
  if (reshaped && present.length > 0) {
    return conflict({ message: `${present.length} records have a value for ${before.name}` });
  }
  const removed = before.options.filter((option) => !next.options.includes(option));
  const stillUsed = removed.filter((choice) =>
    present.some((value) => containsChoice({ value, choice })),
  );
  if (stillUsed.length > 0) {
    return conflict({ message: `Options still in use: ${stillUsed.join(", ")}` });
  }
  if (next.required && !before.required && present.length < values.length) {
    return conflict({ message: `${values.length - present.length} records lack ${before.name}` });
  }
  return ok({ value: true });
}
