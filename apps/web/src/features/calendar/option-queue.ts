import type { OccupancyDto } from "@okazi/core/schemas";

type Option = Pick<OccupancyDto, "id" | "itemId" | "type" | "startsAt" | "endsAt" | "createdAt">;

const overlaps = ({ a, b }: { a: Option; b: Option }): boolean =>
  a.startsAt < b.endsAt && b.startsAt < a.endsAt;

const earlier = ({ a, b }: { a: Option; b: Option }): boolean =>
  a.createdAt < b.createdAt || (a.createdAt.getTime() === b.createdAt.getTime() && a.id < b.id);

/**
 * Queue position of every option (ADR 0022: only options may overlap): 1 + the number of
 * options on the same item that overlap it and were placed earlier. 1 = first option.
 */
export function optionQueuePositions({
  occupancies,
}: {
  occupancies: readonly Option[];
}): Map<string, number> {
  const options = occupancies.filter(({ type }) => type === "OPTION");
  const positions = new Map<string, number>();
  for (const option of options) {
    const ahead = options.filter(
      (other) =>
        other.id !== option.id &&
        other.itemId === option.itemId &&
        overlaps({ a: other, b: option }) &&
        earlier({ a: other, b: option }),
    );
    positions.set(option.id, ahead.length + 1);
  }
  return positions;
}
