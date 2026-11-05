"use client";

import type { EntityTypeDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { entityTypeRoute } from "@/lib/configuration-routes";
import { Link, useRouter } from "@/lib/navigation";
import { ArchiveEntityTypeDialog } from "./archive-entity-type-dialog";

export type EntityTypeRowActionsProps = {
  entityType: EntityTypeDto;
  access: RowAccess;
};

/** Edit / archive menu for one entity type row. */
export function EntityTypeRowActions({ entityType, access }: EntityTypeRowActionsProps) {
  const t = useTranslations("entityType");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  const router = useRouter();
  const detail = entityTypeRoute({ id: entityType.id });
  const primary = access.canEdit
    ? [{ label: t("edit"), icon: PencilIcon, onClick: () => router.push(detail) }]
    : [{ label: common("open"), icon: ExternalLinkIcon, onClick: () => router.push(detail) }];
  return (
    <>
      <DataTableRowActions label={common("actions")} primary={primary}>
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setArchiving(true)}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <ArchiveEntityTypeDialog
        entityType={entityType}
        open={archiving}
        onOpenChange={setArchiving}
      />
    </>
  );
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
