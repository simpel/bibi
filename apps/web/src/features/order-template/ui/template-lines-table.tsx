"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { actionsColumn, type ColumnDef, createTableColumns } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { OrderTemplateFormData } from "./order-template-form-data";
import { TemplateLineDialog } from "./template-line-dialog";
import { TemplateLineRowActions } from "./template-line-row-actions";
import { type TemplateLineRow, useTemplateLineRows } from "./use-template-line-rows";

export type TemplateLinesTableProps = {
  template: OrderTemplateDto;
  data: OrderTemplateFormData;
  canEdit: boolean;
};

/** The template's lines in order: name, item, start, length and quantity; a click edits one. */
export function TemplateLinesTable({ template, data, canEdit }: TemplateLinesTableProps) {
  const t = useTranslations("orderTemplate");
  const common = useTranslations("common");
  const rows = useTemplateLineRows({ template, data });
  const [editing, setEditing] = useState<number | null>(null);
  const columns = useMemo<ColumnDef<TemplateLineRow>[]>(
    () =>
      createTableColumns<TemplateLineRow>({
        primary: [
          {
            id: "name",
            header: t("lineColumns.name"),
            accessorFn: (row) => row.name,
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
          },
        ],
        relations: [{ id: "item", header: t("lineColumns.item"), accessorFn: (row) => row.item }],
        dates: [
          { id: "start", header: t("lineColumns.start"), accessorFn: (row) => row.start },
          { id: "length", header: t("lineColumns.length"), accessorFn: (row) => row.length },
        ],
        numbers: [
          { id: "quantity", header: t("lineColumns.quantity"), accessorFn: (row) => row.quantity },
        ],
        actions: canEdit
          ? [
              actionsColumn<TemplateLineRow>({
                label: common("actions"),
                cell: (row) => (
                  <TemplateLineRowActions template={template} data={data} index={row.index} />
                ),
              }),
            ]
          : [],
      }),
    [t, common, canEdit, template, data],
  );
  return (
    <>
      <PersistedDataTable
        tableId="order-template.lines"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        {...(canEdit ? { onRowClick: (row: TemplateLineRow) => setEditing(row.index) } : {})}
        emptyText={t("linesEmpty")}
      />
      {editing !== null ? (
        <TemplateLineDialog
          template={template}
          data={data}
          index={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
    </>
  );
}
