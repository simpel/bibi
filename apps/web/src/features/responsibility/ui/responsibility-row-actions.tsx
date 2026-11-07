"use client";

import type { ResponsibilityDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { Link, useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveResponsibilityDialog } from "./archive-responsibility-dialog";

/** The update page of one row. */
export const responsibilityEditHref = ({ id }: { id: string }) =>
  updateRoute({ detail: listItemRoute({ list: ROUTES.adminResponsibilities, id }) });

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
  const router = useRouter();
  const editHref = responsibilityEditHref({ id: responsibility.id });
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={
          access.canEdit
            ? [{ label: t("edit"), icon: PencilIcon, onClick: () => router.push(editHref) }]
            : []
        }
      >
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

export type ResponsibilityRowMenuProps = { responsibility: ResponsibilityDto; access: RowAccess };

/** Right-click menu for a row: the edit page. */
export function ResponsibilityRowMenu({ responsibility, access }: ResponsibilityRowMenuProps) {
  const t = useTranslations("responsibility");
  if (!access.canEdit) return null;
  return (
    <ContextMenuItem asChild>
      <Link href={responsibilityEditHref({ id: responsibility.id })}>{t("edit")}</Link>
    </ContextMenuItem>
  );
}
