"use client";

import type { RequirementDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import type { RequirementFormData } from "./requirement-form-data";
import { useRequirementColumns } from "./use-requirement-columns";

export type RequirementTableProps = {
  requirements: RequirementDto[];
  data: RequirementFormData;
  access: RowAccess;
};

/** The ticket's counts: list value, where it applies, the requirement type and how many. */
export function RequirementTable({ requirements, data, access }: RequirementTableProps) {
  const t = useTranslations("requirement");
  const columns = useRequirementColumns({ data, access });
  return (
    <PersistedDataTable
      tableId="requirement.list"
      columns={columns}
      data={requirements}
      getRowId={(row) => row.id}
      emptyText={t("empty")}
    />
  );
}
