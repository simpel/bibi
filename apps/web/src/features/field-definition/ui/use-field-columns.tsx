import type { FieldDefinitionDto } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { FieldRowActions } from "./field-row-actions";
import { fieldSource } from "./field-source";
import type { FieldTableProps } from "./field-table";

type Column = ColumnDef<FieldDefinitionDto>;

/** Name · kind · required · source, plus the row actions when the caller can write. */
export function useFieldColumns({ fields, vocabularies, linkTypes, canWrite }: FieldTableProps) {
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
    if (!canWrite) return data;
    return [
      ...data,
      actionsColumn<FieldDefinitionDto>({
        label: common("actions"),
        cell: (field) => {
          const index = fields.findIndex(({ id }) => id === field.id);
          return (
            <FieldRowActions
              field={field}
              previous={fields[index - 1]}
              next={fields[index + 1]}
              vocabularies={vocabularies}
              linkTypes={linkTypes}
            />
          );
        },
      }),
    ];
  }, [t, common, fields, vocabularies, linkTypes, canWrite]);
}
