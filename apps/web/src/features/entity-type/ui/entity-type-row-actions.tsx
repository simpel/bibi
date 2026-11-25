"use client";

import type { EntityTypeDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RowAccess } from "@/lib/can";
import { entityTypeRoute } from "@/lib/configuration-routes";
import { Link, useRouter } from "@/lib/navigation";

export type EntityTypeRowActionsProps = {
  entityType: EntityTypeDto;
  access: RowAccess;
};

/** Edit (or Open) for one entity type row; it is archived on its own page. */
export function EntityTypeRowActions({ entityType, access }: EntityTypeRowActionsProps) {
  const t = useTranslations("entityType");
  const common = useTranslations("common");
  const router = useRouter();
  const detail = entityTypeRoute({ id: entityType.id });
  const primary = access.canEdit
    ? [{ label: t("edit"), icon: PencilIcon, onClick: () => router.push(detail) }]
    : [{ label: common("open"), icon: ExternalLinkIcon, onClick: () => router.push(detail) }];
  return <DataTableRowActions label={common("actions")} primary={primary} />;
}

/** Right-click context menu for an entity type row. */
export function EntityTypeRowMenu({ entityType, access }: EntityTypeRowActionsProps) {
  const t = useTranslations("entityType");
  const common = useTranslations("common");
  const detail = entityTypeRoute({ id: entityType.id });
  return (
    <ContextMenuItem asChild>
      <Link href={detail}>
        {access.canEdit ? <PencilIcon /> : <ExternalLinkIcon />}
        {access.canEdit ? t("edit") : common("open")}
      </Link>
    </ContextMenuItem>
  );
}
