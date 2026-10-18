import type { ResponsibilityDto } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { namesOf } from "@/features/sheet-definition/ui/sheet-options";
import type { ResponsibilityOption, ResponsibilityOptions } from "./responsibility-options";
import { ResponsibilityRowActions } from "./responsibility-row-actions";

type Column = ColumnDef<ResponsibilityDto>;

export type UseResponsibilityColumnsInput = { options: ResponsibilityOptions; canWrite: boolean };

type NamesInput = { ids: readonly string[]; options: readonly ResponsibilityOption[] };

const names = ({ ids, options }: NamesInput) => {
  const found = namesOf({ ids, options });
  return found.length > 0 ? found.join(", ") : "–";
};

/** Name · types · default assignee · default followers, plus the row actions when writable. */
export function useResponsibilityColumns({
  options,
  canWrite,
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
      {
        id: "assignee",
        header: t("columns.assignee"),
        accessorFn: (r) => names({ ids: [r.defaultAssigneeId], options: options.people }),
      },
      {
        id: "followers",
        header: t("columns.followers"),
        accessorFn: (r) => names({ ids: r.defaultFollowerIds, options: options.people }),
      },
    ];
    if (!canWrite) return data;
    return [
      ...data,
      actionsColumn<ResponsibilityDto>({
        label: common("actions"),
        cell: (r) => <ResponsibilityRowActions responsibility={r} />,
      }),
    ];
  }, [t, common, options, canWrite]);
}
