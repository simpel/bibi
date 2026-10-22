"use client";

import type { AlternativeGroupDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { OptionLine } from "./option-line";
import { useAlternativeGroupColumns } from "./use-alternative-group-columns";

export type AlternativeGroupTableProps = {
  groups: AlternativeGroupDto[];
  lines: OptionLine[];
  canWrite: boolean;
};

/** The ticket's alternative groups: name, options and which one is chosen. */
export function AlternativeGroupTable({ groups, lines, canWrite }: AlternativeGroupTableProps) {
  const t = useTranslations("alternativeGroup");
  const columns = useAlternativeGroupColumns({ lines, canWrite });
  return (
    <PersistedDataTable
      tableId="alternativeGroup.list"
      columns={columns}
      data={groups}
      getRowId={(group) => group.id}
      emptyText={t("empty")}
    />
  );
}
