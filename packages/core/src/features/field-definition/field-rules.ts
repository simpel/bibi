import type { FieldDefinition, RecordMatches } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { mergeUsage, usageConflict } from "../../records/blocking-issues";
import { invalid } from "../../shared/errors";
import { type FieldKind, isChoiceKind } from "./field-kinds";
import { recordsMatching } from "./field-usage";
import { recordsWithValue } from "./field-value-usage";

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
  context: OperationContext;
  before: FieldDefinition;
  next: ChoiceSource & { required: boolean; linkTypeId: string | null };
};

type ChangeInput = Pick<CheckFieldChangeInput, "context" | "before"> & { removed: string[] };

/** The removed inline options that active records still carry, and those records. */
async function optionsInUse({ context, before, removed }: ChangeInput) {
  const { entityTypeId, key } = before;
  const usages: RecordMatches[] = [];
  const used: string[] = [];
  for (const option of removed) {
    const match = { kind: "contains" as const, key, values: [option] };
    const usage = await recordsMatching({ context, entityTypeId, match });
    if (usage.total > 0) used.push(option);
    usages.push(usage);
  }
  return { used, usage: mergeUsage({ usages }) };
}

/**
 * "Data present → CONFLICT" for a field (ADR 0021): the kind, list or link target cannot change and inline
 * options cannot be removed while records use them, and a field cannot become required while
 * records lack a value. Each refusal lists the blocking records (ADR 0056).
 */
export async function checkFieldChange({
  context,
  before,
  next,
}: CheckFieldChangeInput): Promise<Result<true>> {
  const reshaped =
    next.kind !== before.kind ||
    next.vocabularyId !== before.vocabularyId ||
    next.linkTypeId !== before.linkTypeId;
  if (reshaped) {
    const usage = await recordsWithValue({ context, field: before, presence: "has" });
    const message = `${usage.total} records have a value for ${before.name}`;
    if (usage.total > 0) return usageConflict({ context, usage, message });
  }
  const removed = before.options.filter((option) => !next.options.includes(option));
  const options = await optionsInUse({ context, before, removed });
  if (options.used.length > 0) {
    const message = `Options still in use: ${options.used.join(", ")}`;
    return usageConflict({ context, usage: options.usage, message });
  }
  if (next.required && !before.required) {
    const usage = await recordsWithValue({ context, field: before, presence: "lacks" });
    const message = `${usage.total} records lack ${before.name}`;
    if (usage.total > 0) return usageConflict({ context, usage, message });
  }
  return ok({ value: true });
}
