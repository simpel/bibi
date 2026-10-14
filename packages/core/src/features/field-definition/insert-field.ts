import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { freeFieldKey, toFieldKey } from "./field-key";
import { checkChoiceSource } from "./field-rules";
import type { FieldDefinitionCreateInput, FieldDefinitionDto } from "./schema";

export type InsertFieldInput = { context: OperationContext; input: FieldDefinitionCreateInput };

type ResolveKeyInput = InsertFieldInput;

async function resolveKey({ context, input }: ResolveKeyInput): Promise<Result<string>> {
  const { entityTypeId } = input;
  if (!input.key) {
    const base = toFieldKey({ name: input.name });
    return ok({ value: await freeFieldKey({ context, entityTypeId, base }) });
  }
  const taken = await context.db.fieldDefinition.findFirst({
    where: { entityTypeId, key: input.key, status: { in: ["ACTIVE", "ARCHIVED"] } },
  });
  return taken ? conflict({ message: `The key "${input.key}" is used` }) : ok({ value: input.key });
}

/** `fieldDefinition.create`: checks the type, name, key and choice source, then inserts. */
export async function insertField({
  context,
  input,
}: InsertFieldInput): Promise<Result<FieldDefinitionDto>> {
  const { entityTypeId, name, kind, vocabularyId = null, options = [] } = input;
  const type = await context.db.entityType.findFirst({ where: { id: entityTypeId } });
  if (!type) {
    return invalid({
      message: "Unknown type",
      issues: [{ path: "entityTypeId", message: "Unknown type" }],
    });
  }
  if (await context.db.fieldDefinition.findFirst({ where: { entityTypeId, name } })) {
    return conflict({ message: `The type already has a field "${name}"` });
  }
  const source = await checkChoiceSource({ context, source: { kind, vocabularyId, options } });
  if (!source.ok) return source;
  const key = await resolveKey({ context, input });
  if (!key.ok) return key;
  const items = await context.db.item.count({ where: { entityTypeId } });
  if (input.required && items > 0) return conflict({ message: `${items} items lack ${name}` });
  const position =
    input.position ?? (await context.db.fieldDefinition.count({ where: { entityTypeId } }));
  const field = await context.db.fieldDefinition.create({
    data: {
      ...{ entityTypeId, name, kind, vocabularyId, options, position, key: key.value },
      required: input.required ?? false,
      organizationId: context.organizationId,
    },
  });
  context.recordChange({ entityId: field.id, after: field });
  return ok({ value: field });
}
