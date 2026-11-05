import type { useTranslations } from "next-intl";
import type { AiModelViewParams } from "./ai-model-params";
import { type AiFeatureRow, FEATURE_KEY } from "./model-options";

type Translate = ReturnType<typeof useTranslations<"admin.aiModels">>;

export type FilterAiFeaturesInput = {
  rows: AiFeatureRow[];
  q: string | undefined;
  t: Translate;
};

/** Filters AI feature rows by query against name, description and chosen model. */
export function filterAiFeatures({ rows, q, t }: FilterAiFeaturesInput): AiFeatureRow[] {
  if (!q) return rows;
  const needle = q.toLowerCase();
  return rows.filter((row) => {
    const key = FEATURE_KEY[row.setting.id];
    const name = t(`features.${key}.name`).toLowerCase();
    const desc = t(`features.${key}.description`).toLowerCase();
    const model = (row.setting.modelId ?? "").toLowerCase();
    return name.includes(needle) || desc.includes(needle) || model.includes(needle);
  });
}

type ValueInput = { row: AiFeatureRow; sort: AiModelViewParams["sort"]; t: Translate };

function sortValue({ row, sort, t }: ValueInput): string | number {
  if (sort === "feature") return t(`features.${FEATURE_KEY[row.setting.id]}.name`);
  if (sort === "model") return row.setting.modelId ?? "";
  if (sort === "price") {
    return Number(row.models?.find((m) => m.id === row.setting.modelId)?.inputPrice ?? 0);
  }
  return row.setting.updatedAt ? new Date(row.setting.updatedAt).getTime() : 0;
}

export type SortAiFeaturesInput = {
  rows: AiFeatureRow[];
  sort: AiModelViewParams["sort"];
  direction: "asc" | "desc";
  t: Translate;
};

/** Sorts feature rows by the selected column value. */
export function sortAiFeatures({ rows, sort, direction, t }: SortAiFeaturesInput): AiFeatureRow[] {
  return [...rows].sort((a, b) => {
    const valA = sortValue({ row: a, sort, t });
    const valB = sortValue({ row: b, sort, t });
    const diff =
      typeof valA === "number" && typeof valB === "number"
        ? valA - valB
        : String(valA).localeCompare(String(valB), undefined, {
            numeric: true,
            sensitivity: "base",
          });
    return direction === "asc" ? diff : -diff;
  });
}
