"use client";

import type { RoomDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveRoomAction } from "../actions";

export type ArchiveRoomDialogProps = {
  room: RoomDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ArchiveRoomDialog({ room, open, onOpenChange }: ArchiveRoomDialogProps) {
  const t = useTranslations("room");
  const router = useRouter();
  const common = useTranslations("common");
  const { run, pending } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveRoomAction({ id: room.id }),
      messages: { pending: common("archiving"), success: t("archived") },
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("archive")}
      description={t("archiveConfirm", { name: room.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
