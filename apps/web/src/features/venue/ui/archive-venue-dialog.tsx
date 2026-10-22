"use client";

import type { VenueDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveVenueAction } from "../actions";

export type ArchiveVenueDialogProps = {
  venue: VenueDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Detail page leaves the archived venue; the list just refreshes. */
  redirectToList?: boolean;
};

/** Reference for actions without fields: confirm → server action → one toast (CLAUDE.md). */
export function ArchiveVenueDialog({
  venue,
  open,
  onOpenChange,
  redirectToList = false,
}: ArchiveVenueDialogProps) {
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
        if (redirectToList) router.push(ROUTES.venues);
        else router.refresh();
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
