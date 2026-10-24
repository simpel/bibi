import { StatusPath } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

export type ReviewPathProps = { statuses: ComponentProps<typeof StatusPath>["statuses"] };

/** The pipeline the chosen types end up in, as a status path. */
export function ReviewPath({ statuses }: ReviewPathProps) {
  const t = useTranslations("welcome.setup.review");
  return (
    <div className="grid gap-2 rounded-lg border p-4">
      <h2 className="text-sm font-medium">{t("path")}</h2>
      <StatusPath statuses={statuses} label={t("path")} />
    </div>
  );
}
