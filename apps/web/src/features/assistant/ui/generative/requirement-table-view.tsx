"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { bookingRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type RequirementTableViewProps = GenerativeProps<"requirement-table">;

type Row = RequirementTableViewProps["items"][number];

function useRequirementColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.requirement");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "quantity",
        header: t("columns.quantity"),
        accessorFn: (requirement) => requirement.quantity,
        cell: ({ row }) => (
          <Link
            href={bookingRoute({ id: row.original.bookingId })}
            className="font-medium hover:underline"
          >
            {row.original.quantity}
          </Link>
        ),
      },
      {
        id: "where",
        header: t("columns.where"),
        accessorFn: (requirement) =>
          requirement.programItemId ? t("onProgramItem") : t("onBooking"),
      },
    ],
    [t],
  );
}

/** A page of requirements; each row links to its booking's page. */
export function RequirementTableView({ items, nextCursor }: RequirementTableViewProps) {
  const t = useTranslations("assistant.ui.requirement");
  const columns = useRequirementColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="requirement-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.requirement"
        columns={columns}
        data={items}
        getRowId={(requirement) => requirement.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
