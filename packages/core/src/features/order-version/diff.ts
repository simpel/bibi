import { isDeepStrictEqual } from "node:util";
import {
  VERSION_LINE_FIELDS,
  type VersionChanges,
  type VersionLine,
  type VersionLineField,
} from "./schema";

type Headcounts = { estimatedHeadcount: number | null; guaranteedHeadcount: number | null };

export type DiffInput = {
  version: Headcounts & { lines: readonly VersionLine[] };
  now: Headcounts & { lines: readonly VersionLine[] };
};

/** The properties of one line that differ between the version and now. */
export function changedFields({ a, b }: { a: VersionLine; b: VersionLine }): VersionLineField[] {
  return VERSION_LINE_FIELDS.filter((key) => !isDeepStrictEqual(a[key], b[key]));
}

const headcount = ({ from, to }: { from: number | null; to: number | null }) =>
  from === to ? null : { from, to };

/** How the order now differs from a version, paired by line id (ADR 0116). */
export function diffContent({ version, now }: DiffInput): VersionChanges {
  const nowById = new Map(now.lines.map((line) => [line.lineId, line]));
  const inVersion = new Set(version.lines.map((line) => line.lineId));
  const added = now.lines.filter((line) => !inVersion.has(line.lineId));
  const removed = version.lines.filter((line) => !nowById.has(line.lineId));
  const changed = version.lines.flatMap((line) => {
    const current = nowById.get(line.lineId);
    if (!current) return [];
    const fields = changedFields({ a: line, b: current });
    return fields.length > 0 ? [{ line, now: current, fields }] : [];
  });
  const estimatedHeadcount = headcount({
    from: version.estimatedHeadcount,
    to: now.estimatedHeadcount,
  });
  const guaranteedHeadcount = headcount({
    from: version.guaranteedHeadcount,
    to: now.guaranteedHeadcount,
  });
  const count =
    added.length +
    removed.length +
    changed.length +
    (estimatedHeadcount ? 1 : 0) +
    (guaranteedHeadcount ? 1 : 0);
  return { added, removed, changed, estimatedHeadcount, guaranteedHeadcount, count };
}
