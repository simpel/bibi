import type { BookingStatusDto } from "@okazi/core/schemas";
import { ColorSwatch } from "@okazi/ui";

export type BookingStatusLabelProps = { statuses: readonly BookingStatusDto[]; id: string };

/** The booking's status name with its color ("–" for a status that is no longer listed). */
export function BookingStatusLabel({ statuses, id }: BookingStatusLabelProps) {
  const status = statuses.find((candidate) => candidate.id === id);
  if (!status) return <>–</>;
  return (
    <span className="inline-flex items-center gap-2">
      <ColorSwatch color={status.color} />
      {status.name}
    </span>
  );
}
