import { Link } from "@bibi/i18n/navigation";
import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ROUTES } from "@/lib/routes";
import type { TicketTemplateTableViewProps } from "./ticket-template-table-view";

type Row = TicketTemplateTableViewProps["items"][number];

/** Name (link) and line count of the predefined tickets in the chat card. */
export function useTicketTemplateViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.ticketTemplate");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (template) => template.name,
        cell: ({ row: { original: template } }) => (
          <Link href={ROUTES.settingsTicketTemplates} className="font-medium hover:underline">
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
