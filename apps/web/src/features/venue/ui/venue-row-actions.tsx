"use client";

import type { VenueDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { updateRoute, venueRoute } from "@/lib/routes";
import { ArchiveVenueDialog } from "./archive-venue-dialog";

export type VenueRowActionsProps = { venue: VenueDto; redirectToList?: boolean };

/** Edit / archive menu for one venue; used in list rows and on the detail page. */
export function VenueRowActions({ venue, redirectToList = false }: VenueRowActionsProps) {
  const t = useTranslations("venue");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem asChild>
          <Link href={updateRoute({ detail: venueRoute({ id: venue.id }) })}>{t("edit")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setArchiving(true)}>
          {t("archive")}
        </DropdownMenuItem>
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
