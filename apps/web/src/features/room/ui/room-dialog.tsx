"use client";

import type { RoomDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { RoomForm } from "./room-form";

export type RoomDialogProps = {
  venueId: string;
  venueName: string;
  room?: RoomDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RoomDialog({ venueId, venueName, room, open, onOpenChange }: RoomDialogProps) {
  const t = useTranslations("room");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{room ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {room ? t("editDescription") : t("createDescription", { venue: venueName })}
          </DialogDescription>
        </DialogHeader>
        <RoomForm venueId={venueId} room={room} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
