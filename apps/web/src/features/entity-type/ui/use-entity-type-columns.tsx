import type { EntityTypeDto } from "@bibi/core";
import { actionsColumn, Badge, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { entityTypeRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import { CapabilityBadges } from "./capability-badges";

type Column = ColumnDef<EntityTypeDto>;

export type UseEntityTypeColumnsInput = {
  renderActions?: ((row: EntityTypeDto) => ReactNode) | undefined;
};

/** Name · base (Applies to) · capabilities · number of fields · sticky actions. */
export function useEntityTypeColumns({ renderActions }: UseEntityTypeColumnsInput = {}): Column[] {
  const t = useTranslations("entityType");
  const common = useTranslations("common");
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
        id: "base",
        header: t("fields.base"),
        accessorFn: (type) => t(`bases.${type.base}`),
        cell: ({ row }) => <Badge variant="outline">{t(`bases.${row.original.base}`)}</Badge>,
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
      ...(renderActions
        ? [actionsColumn<EntityTypeDto>({ label: common("actions"), cell: renderActions })]
        : []),
    ],
    [t, common, renderActions],
  );
}
