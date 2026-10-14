"use client";

import type { RoomDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useActionSubmit } from "@/lib/use-action-submit";
import { archiveRoomAction } from "../actions";

export type ArchiveRoomDialogProps = {
  room: RoomDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ArchiveRoomDialog({ room, open, onOpenChange }: ArchiveRoomDialogProps) {
  const t = useTranslations("room");
  const router = useRouter();
  const { pending, errorKey, run } = useActionSubmit<RoomDto>({
    onSuccess: () => {
      toast.success(t("archived"));
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
      errorKey={errorKey}
      onConfirm={() => run({ action: () => archiveRoomAction({ id: room.id }) })}
    />
  );
}
