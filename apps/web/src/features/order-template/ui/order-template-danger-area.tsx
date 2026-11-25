"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchiveOrderTemplateDialog } from "./archive-order-template-dialog";

export type OrderTemplateDangerAreaProps = { template: OrderTemplateDto };

/** The package's danger area, its page's last tab: the only place it is archived. */
export function OrderTemplateDangerArea({ template }: OrderTemplateDangerAreaProps) {
  const t = useTranslations("orderTemplate");
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name: template.name })}
      dialog={(state) => <ArchiveOrderTemplateDialog template={template} {...state} />}
    />
  );
}
