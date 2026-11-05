"use client";

import type { VenueDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { Link, useRouter } from "@/lib/navigation";
import { updateRoute, venueRoute } from "@/lib/routes";
import { ArchiveVenueDialog } from "./archive-venue-dialog";

export type VenueRowActionsProps = { venue: VenueDto; redirectToList?: boolean; access: RowAccess };

/** Edit / archive menu for one venue; used in list rows and on the detail page. */
export function VenueRowActions({ venue, redirectToList = false, access }: VenueRowActionsProps) {
  const t = useTranslations("venue");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  const router = useRouter();
  const detail = venueRoute({ id: venue.id });
  const primary = access.canEdit
    ? [{ label: t("edit"), icon: PencilIcon, onClick: () => router.push(updateRoute({ detail })) }]
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
      <ArchiveVenueDialog
        venue={venue}
        open={archiving}
        onOpenChange={setArchiving}
        redirectToList={redirectToList}
      />
    </>
  );
}

/** Right-click context menu for a venue row. */
export function VenueRowMenu({ venue, access }: VenueRowActionsProps) {
  const t = useTranslations("venue");
  const common = useTranslations("common");
  const detail = venueRoute({ id: venue.id });
  return (
    <>
      <ContextMenuItem asChild>
        <Link href={detail}>
          <ExternalLinkIcon />
          {common("open")}
        </Link>
      </ContextMenuItem>
      {access.canEdit ? (
        <ContextMenuItem asChild>
          <Link href={updateRoute({ detail })}>
            <PencilIcon />
            {t("edit")}
          </Link>
        </ContextMenuItem>
      ) : null}
    </>
  );
}
