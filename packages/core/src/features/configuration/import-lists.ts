import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { ConfigurationTemplate } from "../../templates/configuration/configuration-template";
import { getVocabularyTemplate } from "../../templates/vocabularies/vocabulary-templates";
import { insertVocabulary } from "../vocabulary/insert-vocabulary";
import { findVocabularyByName } from "../vocabulary/load-vocabulary";
import type { VocabularyDto } from "../vocabulary/schema";
import { withEntityType } from "./with-entity-type";

export type ImportListsInput = { context: OperationContext; template: ConfigurationTemplate };

export type ImportedLists = {
  created: VocabularyDto[];
  skipped: string[];
  /** List name → id, for created and existing lists alike (fields point to them). */
  ids: Map<string, string>;
};

/** Creates the template's lists that do not exist yet; existing names are kept as they are. */
export async function importLists({
  context,
  template,
}: ImportListsInput): Promise<Result<ImportedLists>> {
  const fromTemplates = template.listTemplates.map((key) => getVocabularyTemplate({ key }));
  const lists: ImportedLists = { created: [], skipped: [], ids: new Map() };
  const audited = withEntityType({ context, entityType: "vocabulary" });
  for (const { name, values } of [...fromTemplates, ...template.lists]) {
    const existing = await findVocabularyByName({ context, name });
    if (existing) {
      lists.skipped.push(name);
      lists.ids.set(name, existing.id);
      continue;
    }
    const list = await insertVocabulary({ context: audited, name, values: [...values] });
    if (!list.ok) return list;
    lists.created.push(list.value);
    lists.ids.set(name, list.value.id);
  }
  return ok({ value: lists });
}
