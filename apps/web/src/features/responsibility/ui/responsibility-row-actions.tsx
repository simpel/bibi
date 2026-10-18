"use client";

import type { ResponsibilityDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveResponsibilityDialog } from "./archive-responsibility-dialog";

export type ResponsibilityRowActionsProps = { responsibility: ResponsibilityDto };

/** Edit / archive menu for one responsibility. */
export function ResponsibilityRowActions({ responsibility }: ResponsibilityRowActionsProps) {
  const t = useTranslations("responsibility");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem asChild>
          <Link
            href={updateRoute({
              detail: listItemRoute({
                list: ROUTES.settingsResponsibilities,
                id: responsibility.id,
              }),
            })}
          >
            {t("edit")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setArchiving(true)}>
          {t("archive")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <ArchiveResponsibilityDialog
        responsibility={responsibility}
        open={archiving}
        onOpenChange={setArchiving}
      />
    </>
  );
}
