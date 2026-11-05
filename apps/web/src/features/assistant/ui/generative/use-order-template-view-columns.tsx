import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { OrderTemplateTableViewProps } from "./order-template-table-view";

type Row = OrderTemplateTableViewProps["items"][number];

/** Name (link) and line count of the predefined orders in the chat card. */
export function useOrderTemplateViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.orderTemplate");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (template) => template.name,
        cell: ({ row: { original: template } }) => (
          <Link href={ROUTES.settingsOrderTemplates} className="font-medium hover:underline">
            {template.name}
          </Link>
        ),
      },
      {
        id: "lines",
        header: t("columns.lines"),
        accessorFn: (template) => template.lines.length,
        cell: ({ row }) => t("lines", { count: row.original.lines.length }),
      },
    ],
    [t],
  );
}
