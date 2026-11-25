"use client";

import type { VenueDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveVenueAction } from "../actions";

export type ArchiveVenueDialogProps = {
  venue: VenueDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Reference for actions without fields: confirm → server action → one toast (CLAUDE.md). It opens
 * from the venue's danger area, and the page is gone afterwards: back to the list.
 */
export function ArchiveVenueDialog({ venue, open, onOpenChange }: ArchiveVenueDialogProps) {
  const t = useTranslations("venue");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveVenueAction({ id: venue.id }),
      messages: { pending: common("archiving"), success: t("archived") },
      onSuccess: () => {
        onOpenChange(false);
        router.push(ROUTES.venues);
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("archive")}
      description={t("archiveConfirm", { name: venue.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
