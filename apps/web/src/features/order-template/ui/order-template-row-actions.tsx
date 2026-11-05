"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveOrderTemplateDialog } from "./archive-order-template-dialog";

export type OrderTemplateRowActionsProps = { template: OrderTemplateDto; access: RowAccess };

/** Edit (page) and archive for one predefined order. */
export function OrderTemplateRowActions({ template, access }: OrderTemplateRowActionsProps) {
  const t = useTranslations("orderTemplate");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  const router = useRouter();
  const detail = listItemRoute({ list: ROUTES.settingsOrderTemplates, id: template.id });
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={
          access.canEdit
            ? [
                {
                  label: t("edit"),
                  icon: PencilIcon,
                  onClick: () => router.push(updateRoute({ detail })),
                },
              ]
            : []
        }
      >
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setArchiving(true)}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <ArchiveOrderTemplateDialog
        template={template}
        open={archiving}
        onOpenChange={setArchiving}
      />
    </>
  );
}
