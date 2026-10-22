"use client";

import type { ResponsibilityDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveResponsibilityDialog } from "./archive-responsibility-dialog";

export type ResponsibilityRowActionsProps = {
  responsibility: ResponsibilityDto;
  access: RowAccess;
};

/** Edit / archive menu for one responsibility. */
export function ResponsibilityRowActions({
  responsibility,
  access,
}: ResponsibilityRowActionsProps) {
  const t = useTranslations("responsibility");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {access.canEdit ? (
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
        ) : null}
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setArchiving(true)}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <ArchiveResponsibilityDialog
        responsibility={responsibility}
        open={archiving}
        onOpenChange={setArchiving}
      />
    </>
  );
}
