"use client";

import { Card, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { setupsRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type SetupTableViewProps = GenerativeProps<"setup-table">;

type Row = SetupTableViewProps["items"][number];

function useSetupColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.setup");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (setup) => setup.name,
        cell: ({ row }) => (
          <Link href={setupsRoute()} className="font-medium hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "changeover",
        header: t("columns.changeover"),
        accessorFn: (setup) => setup.changeoverMinutes,
        cell: ({ row }) => t("changeover", { minutes: row.original.changeoverMinutes }),
      },
    ],
    [t],
  );
}

/** A page of setups; names link to the setups settings page. */
export function SetupTableView({ items, nextCursor }: SetupTableViewProps) {
  const t = useTranslations("assistant.ui.setup");
  const columns = useSetupColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="setup-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.setup"
        columns={columns}
        data={items}
        getRowId={(setup) => setup.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
