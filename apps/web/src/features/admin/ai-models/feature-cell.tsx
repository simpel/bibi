import { Badge } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { type AiFeatureRow, FEATURE_KEY } from "./model-options";

export type FeatureCellProps = { row: AiFeatureRow };

/** Name, description and the loud states: not configured, or no longer a possible model. */
export function FeatureCell({ row: { setting, models } }: FeatureCellProps) {
  const t = useTranslations("admin.aiModels");
  const key = FEATURE_KEY[setting.id];
  const stale =
    setting.modelId !== null && models !== null && !models.some((m) => m.id === setting.modelId);
  return (
    <div className="grid max-w-md gap-1">
      <span className="font-medium">{t(`features.${key}.name`)}</span>
      <span className="text-xs whitespace-normal text-muted-foreground">
        {t(`features.${key}.description`)}
      </span>
      {setting.modelId === null ? (
        <div role="alert" className="grid gap-1">
          <Badge variant="destructive" className="w-fit">
            {t("notConfigured")}
          </Badge>
          <span className="text-xs whitespace-normal text-destructive">
            {t("notConfiguredHint")}
          </span>
        </div>
      ) : null}
      {stale ? (
        <span role="alert" className="text-xs whitespace-normal text-destructive">
          {t("notInCatalog")}
        </span>
      ) : null}
    </div>
  );
}
