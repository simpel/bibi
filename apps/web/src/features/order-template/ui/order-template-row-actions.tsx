"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { orderTemplateHref } from "../template-route";
import { ArchiveOrderTemplateDialog } from "./archive-order-template-dialog";

export type OrderTemplateRowActionsProps = { template: OrderTemplateDto; access: RowAccess };

/** Archive one booking template from its row; it is edited on its own page. */
export function OrderTemplateRowActions({ template, access }: OrderTemplateRowActionsProps) {
  const t = useTranslations("orderTemplate");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  if (!access.canRemove) return null;
  return (
    <>
      <DataTableRowActions label={common("actions")} primary={[]}>
        <DropdownMenuItem destructive onSelect={() => setArchiving(true)}>
          {t("archive")}
        </DropdownMenuItem>
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

/** Right-click menu for a row: open the template, and archive it like the row's ⋯ menu. */
export function OrderTemplateRowMenu({ template, access }: OrderTemplateRowMenuProps) {
  const t = useTranslations("orderTemplate");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  return (
    <>
      <ContextMenuItem asChild>
        <Link href={orderTemplateHref({ id: template.id })}>{common("open")}</Link>
      </ContextMenuItem>
      {access.canRemove ? (
        <ContextMenuItem destructive onSelect={() => setArchiving(true)}>
          {t("archive")}
        </ContextMenuItem>
      ) : null}
      <ArchiveOrderTemplateDialog
        template={template}
        open={archiving}
        onOpenChange={setArchiving}
      />
    </>
  );
}
