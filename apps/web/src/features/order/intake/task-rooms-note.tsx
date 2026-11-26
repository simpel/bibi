import { BedDoubleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { IntakeTaskRoom } from "./intake-task";

/**
 * The rooms the task the order is created from holds (ADR 0120): Create carries each over as a
 * line in the same hold, so they are listed read-only and need no line of their own.
 */
export function TaskRoomsNote({ rooms }: { rooms: readonly IntakeTaskRoom[] }) {
  const t = useTranslations("orderIntake.taskRooms");
  const dates = useDateTimeFormat();
  if (rooms.length === 0) return null;
  return (
    <div className="grid gap-1 rounded-md border bg-muted/40 px-3 py-2 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <BedDoubleIcon className="size-4 text-muted-foreground" aria-hidden />
        {t("title")}
      </p>
      <ul className="grid gap-0.5 text-muted-foreground">
        {rooms.map((room) => (
          <li key={room.itemId}>
            {t("room", {
              name: room.name ?? t("hiddenRoom"),
              hold: room.hold,
              period: dates.dateTimeRange({ start: room.startsAt, end: room.endsAt }),
            })}
          </li>
        ))}
      </ul>
    </div>
  );
}
