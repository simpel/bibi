"use client";

import type { VenueDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { HistorySheet } from "@/features/audit-log/ui/history-sheet";
import type { RowAccess } from "@/lib/can";
import { Link, useRouter } from "@/lib/navigation";
import { updateRoute, venueRoute } from "@/lib/routes";

export type VenueRowActionsProps = {
  venue: VenueDto;
  access: RowAccess;
  /** The history list; when set the menu gets "View history" (detail page, with `audit:read`). */
  history?: ReactNode | null;
};

/** Edit (or Open) for one venue, in list rows and on the detail page (archive: danger area). */
export function VenueRowActions({ venue, access, history }: VenueRowActionsProps) {
  const audit = useTranslations("auditLog");
  const t = useTranslations("venue");
  const common = useTranslations("common");
  const [viewingHistory, setViewingHistory] = useState(false);
  const router = useRouter();
  const detail = venueRoute({ id: venue.id });
  const primary = access.canEdit
    ? [{ label: t("edit"), icon: PencilIcon, onClick: () => router.push(updateRoute({ detail })) }]
    : [{ label: common("open"), icon: ExternalLinkIcon, onClick: () => router.push(detail) }];
  return (
    <>
      <DataTableRowActions label={common("actions")} primary={primary}>
        {history ? (
          <DropdownMenuItem onSelect={() => setViewingHistory(true)}>
            {audit("viewHistory")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      {history ? (
        <HistorySheet open={viewingHistory} onOpenChange={setViewingHistory} history={history} />
      ) : null}
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
