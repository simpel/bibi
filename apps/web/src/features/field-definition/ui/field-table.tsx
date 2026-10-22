"use client";

import type { FieldDefinitionDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import type { VocabularyChoice } from "./field-source-fields";
import { useFieldColumns } from "./use-field-columns";

export type FieldTableProps = {
  fields: FieldDefinitionDto[];
  vocabularies: VocabularyChoice[];
  linkTypes: VocabularyChoice[];
  access: RowAccess;
};

/** Fields of a type: name, kind, required, source and the row actions. */
export function FieldTable({ fields, vocabularies, linkTypes, access }: FieldTableProps) {
  const t = useTranslations("fieldDefinition");
  const columns = useFieldColumns({ fields, vocabularies, linkTypes, access });
  return (
    <PersistedDataTable
      tableId="field-definition.list"
      columns={columns}
      data={fields}
      getRowId={(field) => field.id}
      emptyText={t("empty")}
    />
  );
}
