import { cardNotes, type PackageCardData } from "./package-groups";

/** How a package's bookings stand at the requested time. */
export type RoomsFit =
  | { kind: "FREE" }
  | { kind: "HIDDEN" }
  | { kind: "CLASHES"; count: number }
  | { kind: "WARNINGS"; count: number };

/** A package against the request, row by row (spec step 3, "Your request vs the package"). */
export type PackageCompare = {
  card: PackageCardData;
  guestsFit: boolean;
  /** When the package ends past the requested end, else null. */
  endsLater: Date | null;
  rooms: RoomsFit;
  /** How many rows need a change: 0 = it fits as asked. */
  changes: number;
};

export type CompareInput = {
  card: PackageCardData;
  headcount: number;
  availabilityHidden: boolean;
};

function roomsOf({ notes }: { notes: ReturnType<typeof cardNotes> }): RoomsFit {
  for (const note of notes) {
    if (note.kind === "HIDDEN") return { kind: "HIDDEN" };
    if (note.kind === "CLASHES") return { kind: "CLASHES", count: note.count };
  }
  const warnings = notes.find((note) => note.kind === "WARNINGS");
  return warnings?.kind === "WARNINGS"
    ? { kind: "WARNINGS", count: warnings.count }
    : { kind: "FREE" };
}

/** One package's rows: guests, time and rooms, and how many of them need a change. */
export function comparePackage({
  card,
  headcount,
  availabilityHidden,
}: CompareInput): PackageCompare {
  const notes = cardNotes({ entry: card.entry, headcount, availabilityHidden });
  const guestsFit = !notes.some((note) => note.kind === "GUESTS_OUTSIDE");
  const end = notes.find((note) => note.kind === "PAST_END");
  const endsLater = end?.kind === "PAST_END" ? end.endsAt : null;
  const rooms = roomsOf({ notes });
  const roomChange = rooms.kind === "CLASHES" || rooms.kind === "WARNINGS";
  const changes = [!guestsFit, endsLater !== null, roomChange].filter(Boolean).length;
  return { card, guestsFit, endsLater, rooms, changes };
}

export type RankInput = Omit<CompareInput, "card"> & { cards: PackageCardData[] };

/** Every package, closest to the request first; ties keep the packages' own order. */
export function rankPackages({ cards, ...rest }: RankInput): PackageCompare[] {
  return cards
    .map((card, index) => ({ index, compare: comparePackage({ card, ...rest }) }))
    .sort((a, b) => a.compare.changes - b.compare.changes || a.index - b.index)
    .map(({ compare }) => compare);
}
