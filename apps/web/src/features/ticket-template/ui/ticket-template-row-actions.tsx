"use client";

import type { TicketTemplateDto } from "@okazi/core/schemas";
import { Link } from "@okazi/i18n/navigation";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveTicketTemplateDialog } from "./archive-ticket-template-dialog";

export type TicketTemplateRowActionsProps = { template: TicketTemplateDto };

/** Edit (page) and archive for one predefined ticket. */
export function TicketTemplateRowActions({ template }: TicketTemplateRowActionsProps) {
  const t = useTranslations("ticketTemplate");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  const detail = listItemRoute({ list: ROUTES.settingsTicketTemplates, id: template.id });
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem asChild>
          <Link href={updateRoute({ detail })}>{t("edit")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setArchiving(true)}>
          {t("archive")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <ArchiveTicketTemplateDialog
        template={template}
        open={archiving}
        onOpenChange={setArchiving}
      />
    </>
  );
}
