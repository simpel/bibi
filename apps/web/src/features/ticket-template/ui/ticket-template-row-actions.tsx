"use client";

import type { TicketTemplateDto } from "@okazi/core/schemas";
import { Link } from "@okazi/i18n/navigation";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveTicketTemplateDialog } from "./archive-ticket-template-dialog";

export type TicketTemplateRowActionsProps = { template: TicketTemplateDto; access: RowAccess };

/** Edit (page) and archive for one predefined ticket. */
export function TicketTemplateRowActions({ template, access }: TicketTemplateRowActionsProps) {
  const t = useTranslations("ticketTemplate");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  const detail = listItemRoute({ list: ROUTES.settingsTicketTemplates, id: template.id });
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {access.canEdit ? (
          <DropdownMenuItem asChild>
            <Link href={updateRoute({ detail })}>{t("edit")}</Link>
          </DropdownMenuItem>
        ) : null}
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setArchiving(true)}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <ArchiveTicketTemplateDialog
        template={template}
        open={archiving}
        onOpenChange={setArchiving}
      />
    </>
  );
}
