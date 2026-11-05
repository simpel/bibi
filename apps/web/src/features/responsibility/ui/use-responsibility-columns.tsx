import type { ResponsibilityDto } from "@bibi/core";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersonNames } from "@/components/people/person-names";
import { namesOf } from "@/features/run-sheet-definition/ui/run-sheet-options";
import type { RowAccess } from "@/lib/can";
import type { ResponsibilityOption, ResponsibilityOptions } from "./responsibility-options";
import { ResponsibilityRowActions } from "./responsibility-row-actions";

type Column = ColumnDef<ResponsibilityDto>;

export type UseResponsibilityColumnsInput = { options: ResponsibilityOptions; access: RowAccess };

type NamesInput = { ids: readonly string[]; options: readonly ResponsibilityOption[] };

const names = ({ ids, options }: NamesInput) => {
  const found = namesOf({ ids, options });
  return found.length > 0 ? found.join(", ") : "–";
};

type PeopleColumnInput = {
  id: string;
  header: string;
  people: ResponsibilityOptions["people"];
  ids: (row: ResponsibilityDto) => readonly string[];
};

/** Members by name (sortable, searchable), each opening their contact card. */
const peopleColumn = ({ id, header, people, ids }: PeopleColumnInput): Column => ({
  id,
  header,
  accessorFn: (r) => names({ ids: ids(r), options: people }),
  cell: ({ row }) => <PersonNames ids={ids(row.original)} options={people} />,
});

/**
 * Name · types · default assignee · default followers (each opening their contact card), plus the
 * row actions when writable.
 */
export function useResponsibilityColumns({
  options,
  access,
}: UseResponsibilityColumnsInput): Column[] {
  const t = useTranslations("responsibility");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const data: Column[] = [
      { id: "name", header: t("columns.name"), accessorFn: (r) => r.name },
      {
        id: "types",
        header: t("columns.types"),
        accessorFn: (r) => names({ ids: r.entityTypeIds, options: options.types }),
      },
      peopleColumn({
        ...{ id: "assignee", header: t("columns.assignee"), people: options.people },
        ids: (r) => [r.defaultAssigneeId],
      }),
      peopleColumn({
        ...{ id: "followers", header: t("columns.followers"), people: options.people },
        ids: (r) => r.defaultFollowerIds,
      }),
    ];
    if (!access.canEdit && !access.canRemove) return data;
    return [
      ...data,
      actionsColumn<ResponsibilityDto>({
        label: common("actions"),
        cell: (r) => <ResponsibilityRowActions responsibility={r} access={access} />,
      }),
    ];
  }, [t, common, options, access]);
}
