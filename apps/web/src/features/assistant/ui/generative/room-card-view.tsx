"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { venueRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type RoomCardViewProps = GenerativeProps<"room-card">;

/** One room: name (link to its venue), capacity, area, floor and daylight. */
export function RoomCardView({ room }: RoomCardViewProps) {
  const t = useTranslations("room");
  const assistant = useTranslations("assistant.ui");
  const facts = [
    room.maxCapacity === null ? null : t("capacityValue", { count: room.maxCapacity }),
    room.areaSqm === null ? null : t("areaValue", { value: room.areaSqm }),
    room.floor,
    room.hasDaylight ? t("fields.hasDaylight") : null,
  ].filter(Boolean);
  return (
    <Card data-slot="room-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={venueRoute({ id: room.venueId })} className="hover:underline">
            {room.name}
          </Link>
        </CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        {room.description ? <p className="text-foreground">{room.description}</p> : null}
        {facts.length > 0 ? <p>{facts.join(" · ")}</p> : null}
        <Link href={venueRoute({ id: room.venueId })} className="text-primary hover:underline">
          {assistant("openVenue")}
        </Link>
      </CardContent>
    </Card>
  );
}
