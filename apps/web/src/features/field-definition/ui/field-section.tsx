import { type EntityTypeDto, listVocabularies } from "@okazi/core";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";
import { AddFieldButton } from "./add-field-button";
import { FieldTable } from "./field-table";

export type FieldSectionProps = { entityType: EntityTypeDto };

/** Fields of one type: add, edit, archive and reorder (needs `configuration:write`). */
export async function FieldSection({ entityType }: FieldSectionProps) {
  const t = await getTranslations("fieldDefinition");
  const { configurationWrite } = await getCallerAbilities();
  const lists = await runOperation({ operation: listVocabularies, input: { limit: 100 } });
  const vocabularies = lists.ok ? lists.value.items.map(({ id, name }) => ({ id, name })) : [];
  const { fields } = entityType;
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("plural")}</h2>
        {configurationWrite ? (
          <AddFieldButton entityTypeId={entityType.id} vocabularies={vocabularies} />
        ) : null}
      </div>
      {fields.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <FieldTable fields={fields} vocabularies={vocabularies} canWrite={configurationWrite} />
      )}
    </section>
  );
}
