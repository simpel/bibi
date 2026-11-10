import type { EntityTypeDto } from "@bibi/core";
import { actionsColumn, Badge, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { entityTypeRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import { CapabilityBadges } from "./capability-badges";

type Column = ColumnDef<EntityTypeDto>;

type GroupNameInput = { groups: readonly { id: string; name: string }[]; type: EntityTypeDto };

/** The name of an item type's group; "–" for other bases and ungrouped types. */
function groupName({ groups, type }: GroupNameInput): string {
  return groups.find((group) => group.id === type.groupId)?.name ?? "–";
}

export type UseEntityTypeColumnsInput = {
  /** Group names by id; with none, the Group column is left out. */
  groups?: readonly { id: string; name: string }[] | undefined;
  renderActions?: ((row: EntityTypeDto) => ReactNode) | undefined;
};

/** Name · base (Applies to) · capabilities · number of fields · sticky actions. */
export function useEntityTypeColumns({
  renderActions,
  groups = [],
}: UseEntityTypeColumnsInput = {}): Column[] {
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
      ...(groups.length > 0
        ? [
            {
              id: "group",
              header: t("columns.group"),
              accessorFn: (type: EntityTypeDto) => groupName({ groups, type }),
              cell: ({ row }: { row: { original: EntityTypeDto } }) =>
                groupName({ groups, type: row.original }),
            } satisfies Column,
          ]
        : []),
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
    [t, common, renderActions, groups],
  );
}
