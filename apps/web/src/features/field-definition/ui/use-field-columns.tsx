import type { FieldDefinitionDto } from "@bibi/core";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { FieldRowActions } from "./field-row-actions";
import { fieldSource } from "./field-source";
import type { FieldTableProps } from "./field-table";

type Column = ColumnDef<FieldDefinitionDto>;

const neighbours = ({ fields, id }: { fields: FieldTableProps["fields"]; id: string }) => {
  const index = fields.findIndex((field) => field.id === id);
  return { previous: fields[index - 1], next: fields[index + 1] };
};

/** Name · kind · required · source, plus the row actions when the caller can write. */
export function useFieldColumns({ fields, vocabularies, linkTypes, access }: FieldTableProps) {
  const t = useTranslations("fieldDefinition");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const data: Column[] = [
      { id: "name", header: t("columns.name"), accessorFn: (f) => f.name },
      { id: "kind", header: t("columns.kind"), accessorFn: (f) => t(`kinds.${f.kind}`) },
      {
        id: "required",
        header: t("columns.required"),
        accessorFn: (f) => f.required,
        cell: ({ row }) => (row.original.required ? common("yes") : common("no")),
      },
      {
        id: "source",
        header: t("columns.source"),
        accessorFn: (f) => fieldSource({ field: f, vocabularies, linkTypes, t }),
      },
    ];
    if (!access.canEdit && !access.canRemove) return data;
    return [
      ...data,
      actionsColumn<FieldDefinitionDto>({
        label: common("actions"),
        cell: (field) => (
          <FieldRowActions
            field={field}
            {...neighbours({ fields, id: field.id })}
            vocabularies={vocabularies}
            linkTypes={linkTypes}
            access={access}
          />
        ),
      }),
    ];
  }, [t, common, fields, vocabularies, linkTypes, access]);
}
