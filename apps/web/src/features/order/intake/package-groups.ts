import type { PreviewEntry } from "@bibi/core";

/** One line of a package as step 3 shows it: its name and its item's icon or image. */
export type PackageLineView = { name: string; icon: string | null; imageUrl: string | null };

/** An active package as step 3 lists it (prepared on the server). */
export type PackageOption = {
  id: string;
  name: string;
  minGuests: number | null;
  maxGuests: number | null;
  /** The order type its orders get, with its default own field values. */
  entityTypeId: string;
  fields: Record<string, unknown>;
  /** Its own image (`/api/files/…`); null = its first line's picture. */
  imageUrl: string | null;
  /** Its lines in order with their item's picture, for the list and the detail. */
  lines: PackageLineView[];
  /** The items its lines book: the calendar's resource filters by them. */
  itemIds: string[];
};

export type PackageCardData = { option: PackageOption; entry: PreviewEntry };

export type PackageCardsInput = { options: PackageOption[]; entries: PreviewEntry[] };

/** Each package with its preview entry, in the packages' order; one without an entry is left out. */
export function packageCards({ options, entries }: PackageCardsInput): PackageCardData[] {
  const byTemplate = new Map(entries.map((entry) => [entry.templateId, entry]));
  return options.flatMap((option) => {
    const entry = byTemplate.get(option.id);
    return entry ? [{ option, entry }] : [];
  });
}

/** One note on a package card: ✓ available, ⚠ a warning, ✕ clashes (spec step 3). */
export type CardNote =
  | { kind: "AVAILABLE"; tone: "ok" }
  | { kind: "HIDDEN"; tone: "muted" }
  | { kind: "WARNINGS"; tone: "warn"; count: number }
  | { kind: "CLASHES"; tone: "clash"; count: number }
  | { kind: "GUESTS_OUTSIDE"; tone: "warn"; headcount: number }
  | { kind: "PAST_END"; tone: "warn"; endsAt: Date };

export type CardNotesInput = {
  entry: PreviewEntry;
  headcount: number;
  availabilityHidden: boolean;
};

const countIssues = ({ entry, hard }: { entry: PreviewEntry; hard: boolean }) =>
  entry.lines.flatMap((line) => line.issues).filter(({ kind }) => (kind === "HARD_CLASH") === hard)
    .length;

function availabilityNotes({ entry, availabilityHidden }: CardNotesInput): CardNote[] {
  if (availabilityHidden) return [{ kind: "HIDDEN", tone: "muted" }];
  const clashes = countIssues({ entry, hard: true });
  const warnings = countIssues({ entry, hard: false });
  const notes: CardNote[] = [];
  if (clashes > 0) notes.push({ kind: "CLASHES", tone: "clash", count: clashes });
  if (warnings > 0) notes.push({ kind: "WARNINGS", tone: "warn", count: warnings });
  return notes.length > 0 ? notes : [{ kind: "AVAILABLE", tone: "ok" }];
}

/** The card's notes: availability first, then the guest range and the end against the request. */
export function cardNotes({ entry, headcount, availabilityHidden }: CardNotesInput): CardNote[] {
  const notes = availabilityNotes({ entry, headcount, availabilityHidden });
  if (entry.issues.some(({ kind }) => kind === "GUESTS_OUTSIDE_RANGE")) {
    notes.push({ kind: "GUESTS_OUTSIDE", tone: "warn", headcount });
  }
  const end = entry.issues.find(({ kind }) => kind === "PAST_REQUESTED_END");
  const endsAt = end?.endsAt ?? entry.endsAt;
  if (end && endsAt) notes.push({ kind: "PAST_END", tone: "warn", endsAt });
  return notes;
}
