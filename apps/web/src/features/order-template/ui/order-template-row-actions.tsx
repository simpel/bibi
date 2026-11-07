"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { Link, useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveOrderTemplateDialog } from "./archive-order-template-dialog";

/** The update page of one row. */
export const orderTemplateEditHref = ({ id }: { id: string }) =>
  updateRoute({ detail: listItemRoute({ list: ROUTES.adminOrderTemplates, id }) });

export type OrderTemplateRowActionsProps = { template: OrderTemplateDto; access: RowAccess };

/** Edit (page) and archive for one predefined order. */
export function OrderTemplateRowActions({ template, access }: OrderTemplateRowActionsProps) {
  const t = useTranslations("orderTemplate");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  const router = useRouter();
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
                  onClick: () => router.push(orderTemplateEditHref({ id: template.id })),
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

export type OrderTemplateRowMenuProps = { template: OrderTemplateDto; access: RowAccess };

/** Right-click menu for a row: the edit page. */
export function OrderTemplateRowMenu({ template, access }: OrderTemplateRowMenuProps) {
  const t = useTranslations("orderTemplate");
  if (!access.canEdit) return null;
  return (
    <ContextMenuItem asChild>
      <Link href={orderTemplateEditHref({ id: template.id })}>{t("edit")}</Link>
    </ContextMenuItem>
  );
}
