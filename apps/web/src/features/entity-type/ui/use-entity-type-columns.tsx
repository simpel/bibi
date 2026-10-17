import type { EntityTypeDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import type { ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { entityTypeRoute } from "@/lib/configuration-routes";
import { BehaviourBadges } from "./behaviour-badges";

type Column = ColumnDef<EntityTypeDto>;

/** Name · behaviours · number of fields. */
export function useEntityTypeColumns(): Column[] {
  const t = useTranslations("entityType");
  return useMemo<Column[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (type) => type.name,
        cell: ({ row }) => (
          <Link
            href={entityTypeRoute({ id: row.original.id })}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "behaviours",
        header: t("columns.behaviours"),
        accessorFn: (type) => type.behaviours.map((b) => t(`behaviours.${b}`)).join(", "),
        cell: ({ row }) => <BehaviourBadges behaviours={row.original.behaviours} />,
      },
      {
        id: "fields",
        header: t("columns.fields"),
        accessorFn: (type) => type.fields.length,
        cell: ({ row }) => t("fieldCount", { count: row.original.fields.length }),
      },
    ],
    [t],
  );
}
