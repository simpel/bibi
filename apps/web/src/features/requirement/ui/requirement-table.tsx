"use client";

import type { RequirementDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RequirementFormData } from "./requirement-form-data";
import { useRequirementColumns } from "./use-requirement-columns";

export type RequirementTableProps = {
  requirements: RequirementDto[];
  data: RequirementFormData;
  canWrite: boolean;
};

/** The booking's counts: list value, where it applies, the requirement type and how many. */
export function RequirementTable({ requirements, data, canWrite }: RequirementTableProps) {
  const t = useTranslations("requirement");
  const columns = useRequirementColumns({ data, canWrite });
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
