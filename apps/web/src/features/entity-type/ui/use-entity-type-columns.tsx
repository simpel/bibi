import type { EntityTypeDto } from "@bibi/core";
import { Link } from "@bibi/i18n/navigation";
import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { entityTypeRoute } from "@/lib/configuration-routes";
import { CapabilityBadges } from "./capability-badges";

type Column = ColumnDef<EntityTypeDto>;

/** Name · capabilities · number of fields. */
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
        id: "capabilities",
        header: t("columns.capabilities"),
        accessorFn: (type) => type.capabilities.map((b) => t(`capabilities.${b}`)).join(", "),
        cell: ({ row }) => <CapabilityBadges capabilities={row.original.capabilities} />,
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
