"use client";

import { usePathname, useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RoomDialog } from "./room-dialog";

export type CreateRoomButtonProps = { venueId: string; venueName: string };

/** Opens the create-room dialog; also opens on `?createRoom=1` (⌘K "add room to ..." action). */
export function CreateRoomButton({ venueId, venueName }: CreateRoomButtonProps) {
  const t = useTranslations("room");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(useSearchParams().get("createRoom") === "1");
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) router.replace(pathname);
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <RoomDialog venueId={venueId} venueName={venueName} open={open} onOpenChange={onOpenChange} />
    </>
  );
}
