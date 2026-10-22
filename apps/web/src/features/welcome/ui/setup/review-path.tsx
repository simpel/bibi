import { PhasePath } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

export type ReviewPathProps = { phases: ComponentProps<typeof PhasePath>["phases"] };

/** The pipeline the chosen types end up in, as a phase path. */
export function ReviewPath({ phases }: ReviewPathProps) {
  const t = useTranslations("welcome.setup.review");
  return (
    <div className="grid gap-2 rounded-lg border p-4">
      <h2 className="text-sm font-medium">{t("path")}</h2>
      <PhasePath phases={phases} label={t("path")} />
    </div>
  );
}
