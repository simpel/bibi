import type { PlanGroup, PreviewEntry } from "@bibi/core";

/** An active package as step 3 lists it (prepared on the server). */
export type PackageOption = {
  id: string;
  name: string;
  minGuests: number | null;
  maxGuests: number | null;
  /** The ticket type its tickets get, with its default own field values. */
  entityTypeId: string;
  fields: Record<string, unknown>;
  /** Its lines' names in order, for the card's summary. */
  lineNames: string[];
};

export type PackageCardData = { option: PackageOption; entry: PreviewEntry };

export type PackageGroups = Record<PlanGroup, PackageCardData[]>;

export type GroupPackagesInput = { options: PackageOption[]; entries: PreviewEntry[] };

/** Each package in the group its preview gave it (ADR 0081 decision 5), in the packages' order. */
export function groupPackages({ options, entries }: GroupPackagesInput): PackageGroups {
  const groups: PackageGroups = { AVAILABLE: [], CLASHES: [], OUTSIDE_RANGE: [] };
  const byTemplate = new Map(entries.map((entry) => [entry.templateId, entry]));
  for (const option of options) {
    const entry = byTemplate.get(option.id);
    if (entry) groups[entry.group].push({ option, entry });
  }
  return groups;
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
