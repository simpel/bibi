"use client";

import type { VenueDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ROUTES } from "@/lib/routes";
import { useActionSubmit } from "@/lib/use-action-submit";
import { archiveVenueAction } from "../actions";

export type ArchiveVenueDialogProps = {
  venue: VenueDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Detail page leaves the archived venue; the list just refreshes. */
  redirectToList?: boolean;
};

export function ArchiveVenueDialog({
  venue,
  open,
  onOpenChange,
  redirectToList = false,
}: ArchiveVenueDialogProps) {
  const t = useTranslations("venue");
  const router = useRouter();
  const { pending, errorKey, run } = useActionSubmit<VenueDto>({
    onSuccess: () => {
      toast.success(t("archived"));
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
      errorKey={errorKey}
      onConfirm={() => run({ action: () => archiveVenueAction({ id: venue.id }) })}
    />
  );
}
