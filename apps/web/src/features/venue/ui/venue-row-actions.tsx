"use client";

import type { VenueDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { updateRoute, venueRoute } from "@/lib/routes";
import { ArchiveVenueDialog } from "./archive-venue-dialog";

export type VenueRowActionsProps = { venue: VenueDto; redirectToList?: boolean; access: RowAccess };

/** Edit / archive menu for one venue; used in list rows and on the detail page. */
export function VenueRowActions({ venue, redirectToList = false, access }: VenueRowActionsProps) {
  const t = useTranslations("venue");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {access.canEdit ? (
          <DropdownMenuItem asChild>
            <Link href={updateRoute({ detail: venueRoute({ id: venue.id }) })}>{t("edit")}</Link>
          </DropdownMenuItem>
        ) : null}
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
