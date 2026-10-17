import type { BookingStatusDto } from "@okazi/core/schemas";

/** One table row: a status with the names it may move to and whether it is its phase's default. */
export type StatusRow = {
  status: BookingStatusDto;
  index: number;
  targets: string[];
  isDefault: boolean;
};

export type ToStatusRowsInput = { statuses: readonly BookingStatusDto[] };

/** The first status of a phase is its default; unknown transition targets fall back to the id. */
export function toStatusRows({ statuses }: ToStatusRowsInput): StatusRow[] {
  return statuses.map((status, index) => ({
    status,
    index,
    targets: status.transitionsTo.map(
      (id) => statuses.find((target) => target.id === id)?.name ?? id,
    ),
    isDefault: statuses[index - 1]?.phase !== status.phase,
  }));
}
