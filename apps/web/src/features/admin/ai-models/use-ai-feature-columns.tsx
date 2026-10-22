import type { ColumnDef } from "@bibi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { FeatureCell } from "./feature-cell";
import type { AiFeatureRow } from "./model-options";
import { ModelPrice } from "./model-price";
import { ModelSelectForm } from "./model-select-form";

type Column = ColumnDef<AiFeatureRow>;

/** Feature · model picker (form) · price of the chosen model · last change. */
export function useAiFeatureColumns(): Column[] {
  const t = useTranslations("admin.aiModels.columns");
  const format = useFormatter();
  return useMemo<Column[]>(
    () => [
      {
        id: "feature",
        header: t("feature"),
        cell: ({ row }) => <FeatureCell row={row.original} />,
      },
      {
        id: "model",
        header: t("model"),
        cell: ({ row }) => <ModelSelectForm row={row.original} />,
      },
      {
        id: "price",
        header: t("price"),
        cell: ({ row: { original } }) => (
          <ModelPrice model={original.models?.find((m) => m.id === original.setting.modelId)} />
        ),
      },
      {
        id: "changed",
        header: t("changed"),
        cell: ({ row: { original } }) =>
          original.setting.updatedAt
            ? format.dateTime(original.setting.updatedAt, {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "–",
      },
    ],
    [t, format],
  );
}
