import { type EntityTypeDto, listVocabularies } from "@bibi/core";
import { isLinkableBase } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { loadEntityTypes } from "@/server/load-entity-types";
import { runOperation } from "@/server/run-operation";
import { AddFieldButton } from "./add-field-button";
import { FieldTable } from "./field-table";

export type FieldSectionProps = { entityType: EntityTypeDto };

/** Fields of one type: add, edit, archive and reorder (`configuration:*`). */
export async function FieldSection({ entityType }: FieldSectionProps) {
  const [t, abilities, lists, types] = await Promise.all([
    getTranslations("fieldDefinition"),
    getCallerAbilities(),
    runOperation({ operation: listVocabularies, input: { limit: 100 } }),
    loadEntityTypes(),
  ]);
  const vocabularies = lists.ok ? lists.value.items.map(({ id, name }) => ({ id, name })) : [];
  const linkTypes = (types.ok ? types.value.items : [])
    .filter(({ base }) => isLinkableBase({ base }))
    .map(({ id, name }) => ({ id, name }));
  const { fields } = entityType;
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl">{t("plural")}</h2>
        {can({ abilities, permission: "configuration:write" }) ? (
          <AddFieldButton
            entityTypeId={entityType.id}
            vocabularies={vocabularies}
            linkTypes={linkTypes}
          />
        ) : null}
      </div>
      {fields.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <FieldTable
          fields={fields}
          vocabularies={vocabularies}
          linkTypes={linkTypes}
          access={rowAccess({ abilities, feature: "configuration" })}
        />
      )}
    </section>
  );
}
