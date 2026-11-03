"use client";

import type { TicketTemplateDto } from "@bibi/core/schemas";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveTicketTemplateDialog } from "./archive-ticket-template-dialog";

export type TicketTemplateRowActionsProps = { template: TicketTemplateDto; access: RowAccess };

/** Edit (page) and archive for one predefined ticket. */
export function TicketTemplateRowActions({ template, access }: TicketTemplateRowActionsProps) {
  const t = useTranslations("ticketTemplate");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  const router = useRouter();
  const detail = listItemRoute({ list: ROUTES.settingsTicketTemplates, id: template.id });
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
      <ArchiveTicketTemplateDialog
        template={template}
        open={archiving}
        onOpenChange={setArchiving}
      />
    </>
  );
}
