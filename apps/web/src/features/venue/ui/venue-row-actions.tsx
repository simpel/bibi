"use client";

import type { VenueDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveVenueDialog } from "./archive-venue-dialog";
import { VenueDialog } from "./venue-dialog";

export type VenueRowActionsProps = { venue: VenueDto; redirectToList?: boolean };

/** Edit / archive menu for one venue; used in list rows and on the detail page. */
export function VenueRowActions({ venue, redirectToList = false }: VenueRowActionsProps) {
  const t = useTranslations("venue");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
          {t("archive")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <VenueDialog
        venue={venue}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveVenueDialog
        venue={venue}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
        redirectToList={redirectToList}
      />
    </>
  );
}
