"use client";

import type { OptionDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useOptionColumns } from "./use-option-columns";

export type OptionTableProps = { options: OptionDto[]; canWrite: boolean };

/** The queue: rank, held period, expiry and note; options can be released. */
export function OptionTable({ options, canWrite }: OptionTableProps) {
  const t = useTranslations("option");
  const columns = useOptionColumns({ canWrite });
  return (
    <PersistedDataTable
      tableId="option.list"
      columns={columns}
      data={options}
      getRowId={(option) => option.id}
      emptyText={t("empty")}
    />
  );
}
