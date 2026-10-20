import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type {
  ConfigurationTemplate,
  ConfigurationTemplateType,
} from "../../templates/configuration/configuration-template";
import { insertEntityType } from "../entity-type/insert-entity-type";
import { toEntityTypeDto } from "../entity-type/load-entity-type";
import type { EntityTypeDto } from "../entity-type/schema";
import { insertField } from "../field-definition/insert-field";
import { withEntityType } from "./with-entity-type";

type CreateTypeInput = {
  context: OperationContext;
  type: ConfigurationTemplateType;
  listIds: ReadonlyMap<string, string>;
};

/** One type and its fields, in template order. */
async function createType({ context, type, listIds }: CreateTypeInput) {
  const { base, name, capabilities = [] } = type;
  const audited = withEntityType({ context, entityType: "entityType" });
  const created = await insertEntityType({ context: audited, base, name, capabilities });
  if (!created.ok) return created;
  const fieldContext = withEntityType({ context, entityType: "fieldDefinition" });
  for (const { list, options, ...field } of type.fields ?? []) {
    const vocabularyId = list ? listIds.get(list) : undefined;
    if (list && !vocabularyId) {
      return err({ error: new AppError({ code: "INTERNAL", message: `Unknown list ${list}` }) });
    }
    const input = {
      ...field,
      entityTypeId: created.value.id,
      ...(vocabularyId ? { vocabularyId } : {}),
      ...(options ? { options: [...options] } : {}),
    };
    const result = await insertField({ context: fieldContext, input });
    if (!result.ok) return result;
  }
  return ok({ value: await toEntityTypeDto({ context, row: created.value }) });
}

export type ImportTypesInput = Omit<CreateTypeInput, "type"> & {
  template: ConfigurationTemplate;
};

export type ImportedTypes = { created: EntityTypeDto[]; skipped: string[] };

/** Creates the template's types that do not exist yet. An existing type keeps its own fields. */
export async function importTypes({
  context,
  template,
  listIds,
}: ImportTypesInput): Promise<Result<ImportedTypes>> {
  const types: ImportedTypes = { created: [], skipped: [] };
  for (const type of template.types) {
    const { base, name } = type;
    if (await context.db.entityType.findFirst({ where: { base, name } })) {
      types.skipped.push(name);
      continue;
    }
    const created = await createType({ context, type, listIds });
    if (!created.ok) return created;
    types.created.push(created.value);
  }
  return ok({ value: types });
}
