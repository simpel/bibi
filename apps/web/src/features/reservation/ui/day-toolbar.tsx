"use client";

import { addDays, parseIsoDate, toIsoDate } from "@bibi/core/schemas";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { PlainDateButton } from "@/components/date-picker/plain-date-button";
import { useRouter } from "@/lib/navigation";
import { dayRoute } from "../lib/routes";

export type DayToolbarProps = {
  rooms: readonly { itemId: string; name: string }[];
  roomItemId: string;
  date: string;
  today: string;
};

const shift = ({ date, days }: { date: string; days: number }) =>
  toIsoDate({ date: addDays({ date: parseIsoDate({ value: date }), days }) });

/** Room and day of the day screen: each choice is a URL, so the server renders again. */
export function DayToolbar({ rooms, roomItemId, date, today }: DayToolbarProps) {
  const t = useTranslations("reservation");
  const router = useRouter();
  const go = ({ to, room = roomItemId }: { to: string; room?: string }) =>
    router.push(dayRoute({ date: to, room }));
  return (
    <div className="flex flex-wrap items-center gap-3">
      {rooms.length > 1 ? (
        <Select value={roomItemId} onValueChange={(room) => go({ to: date, room })}>
          <SelectTrigger className="h-12 w-56 text-base" aria-label={t("room")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((room) => (
              <SelectItem key={room.itemId} value={room.itemId}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-12"
          aria-label={t("day.previous")}
          onClick={() => go({ to: shift({ date, days: -1 }) })}
        >
          <ChevronLeftIcon className="size-5" />
        </Button>
        <div className="[&_button]:h-12 [&_button]:text-base">
          <PlainDateButton value={date} onChange={(to) => to && go({ to })} />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-12"
          aria-label={t("day.next")}
          onClick={() => go({ to: shift({ date, days: 1 }) })}
        >
          <ChevronRightIcon className="size-5" />
        </Button>
        <Button
          variant="ghost"
          className="h-12 text-base"
          disabled={date === today}
          onClick={() => go({ to: today })}
        >
          {t("day.today")}
        </Button>
      </div>
    </div>
  );
}
