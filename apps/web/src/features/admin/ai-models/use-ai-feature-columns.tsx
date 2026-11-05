import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { FeatureCell } from "./feature-cell";
import { type AiFeatureRow, FEATURE_KEY } from "./model-options";
import { ModelPrice } from "./model-price";
import { ModelSelectForm } from "./model-select-form";

type Column = ColumnDef<AiFeatureRow>;

/** Feature · model picker (form) · last change · price of the chosen model. */
export function useAiFeatureColumns(): Column[] {
  const t = useTranslations("admin.aiModels");
  const format = useDateTimeFormat();
  return useMemo<Column[]>(
    () => [
      {
        id: "feature",
        header: t("columns.feature"),
        accessorFn: (row) => t(`features.${FEATURE_KEY[row.setting.id]}.name`),
        cell: ({ row }) => <FeatureCell row={row.original} />,
      },
      {
        id: "model",
        header: t("columns.model"),
        accessorFn: (row) => row.setting.modelId ?? "",
        cell: ({ row }) => <ModelSelectForm row={row.original} />,
      },
      {
        id: "changed",
        header: t("columns.changed"),
        accessorFn: (row) =>
          row.setting.updatedAt ? new Date(row.setting.updatedAt).getTime() : 0,
        cell: ({ row: { original } }) =>
          original.setting.updatedAt
            ? format.dateTime({ instant: original.setting.updatedAt })
            : "–",
      },
      {
        id: "price",
        header: t("columns.price"),
        accessorFn: (row) =>
          row.models?.find((m) => m.id === row.setting.modelId)?.inputPrice ?? "",
        cell: ({ row: { original } }) => (
          <ModelPrice model={original.models?.find((m) => m.id === original.setting.modelId)} />
        ),
      },
    ],
    [t, format],
  );
}
