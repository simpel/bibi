"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { MoreHorizontalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { tableBookingRoomRoute } from "../../table-booking/lib/routes";

export type AdminMenuProps = { roomItemId: string };

/** The way from the day view to the room's setup: sittings, held-back tables, tables, booking page. */
export function AdminMenu({ roomItemId }: AdminMenuProps) {
  const t = useTranslations("reservation.adminMenu");
  const room = tableBookingRoomRoute({ itemId: roomItemId });
  const items = [
    { key: "setup", href: room },
    { key: "blocks", href: `${room}#blocks` },
    { key: "tables", href: `${room}#tables` },
    { key: "bookingPage", href: ROUTES.adminTableBooking },
    { key: "preview", href: ROUTES.adminTableBookingPreview },
  ] as const;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="size-12 shrink-0" aria-label={t("label")}>
          <MoreHorizontalIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {items.map(({ key, href }) => (
          <DropdownMenuItem key={key} asChild className="h-12 text-base">
            <Link href={href}>{t(key)}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
