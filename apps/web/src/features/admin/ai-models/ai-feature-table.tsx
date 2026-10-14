"use client";

import { DataTable } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { AiFeatureRow } from "./model-options";
import { useAiFeatureColumns } from "./use-ai-feature-columns";

export type AiFeatureTableProps = { rows: AiFeatureRow[] };

/** All AI features in one table; each row picks its model in place. */
export function AiFeatureTable({ rows }: AiFeatureTableProps) {
  const t = useTranslations("admin.aiModels");
  const columns = useAiFeatureColumns();
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.setting.id}
      emptyText={t("empty")}
    />
  );
}
