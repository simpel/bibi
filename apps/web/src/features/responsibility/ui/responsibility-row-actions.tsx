"use client";

import type { ResponsibilityDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RowAccess } from "@/lib/can";
import { Link, useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";

/** The update page of one row. */
export const responsibilityEditHref = ({ id }: { id: string }) =>
  updateRoute({ detail: listItemRoute({ list: ROUTES.adminResponsibilities, id }) });

export type ResponsibilityRowActionsProps = {
  responsibility: ResponsibilityDto;
  access: RowAccess;
};

/** Edit for one responsibility; it is archived on its own page. */
export function ResponsibilityRowActions({
  responsibility,
  access,
}: ResponsibilityRowActionsProps) {
  const t = useTranslations("responsibility");
  const common = useTranslations("common");
  const router = useRouter();
  const editHref = responsibilityEditHref({ id: responsibility.id });
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={
        access.canEdit
          ? [{ label: t("edit"), icon: PencilIcon, onClick: () => router.push(editHref) }]
          : []
      }
    />
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
