import type {
  QueryCatalog,
  QueryTexts,
} from "@/components/query-search/lib/query-suggestion-types";
import { fold, type QueryVocabulary } from "@/components/query-search/lib/query-vocabulary";

export type TableQualifier<TRow> = {
  /** Canonical key and icon id (e.g. `type`, `status`, `venue`, `city`, `role`, `channel`). */
  key: string;
  /** Localized label shown in the dropdown and used as the localized qualifier word. */
  label: string;
  /** Optional hint shown on the right of the qualifier row; defaults to the first options. */
  hint?: string | undefined;
  /** Distinct values offered when the qualifier is picked. */
  options: readonly string[];
  /** Value(s) of a row for this qualifier. */
  pick: (row: TRow) => string | readonly string[] | null | undefined;
};

export type BuiltTableQuery = {
  vocabulary: QueryVocabulary;
  texts: QueryTexts;
  catalog: QueryCatalog;
};

const slugWord = ({ text }: { text: string }) =>
  fold({ text })
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "") || text.toLowerCase();

/** Builds `QuerySearch`'s `vocabulary`, `texts` and `catalog` from a table's qualifiers. */
export function buildTableQuery<TRow>({
  qualifiers,
}: {
  qualifiers: readonly TableQualifier<TRow>[];
}): BuiltTableQuery {
  const keys = qualifiers.map((q) => q.key);
  const words: Record<string, string> = {};
  const labels: Record<string, string> = {};
  const hints: Record<string, string> = {};
  const catalog: QueryCatalog = {};
  for (const q of qualifiers) {
    const distinct = [...new Set(q.options.map((v) => v.trim()).filter((v) => v && v !== "–"))];
    words[q.key] = slugWord({ text: q.label }) || q.key;
    labels[q.key] = q.label;
    hints[q.key] = q.hint ?? (distinct.slice(0, 3).join(", ") || q.label.toLowerCase());
    catalog[q.key] = distinct;
  }
  return {
    vocabulary: { qualifiers: keys, fixed: {}, emptyFields: [], words, values: {}, empty: {} },
    texts: { labels, hints, noAssignee: "", hasAssignee: "", me: "", exclude: {} },
    catalog,
  };
}

type ParsedToken =
  | { kind: "qualifier"; key: string; values: string[]; negated: boolean }
  | { kind: "text"; value: string; negated: boolean };

const splitValues = ({ raw }: { raw: string }): string[] =>
  raw
    .split(",")
    .map((part) => fold({ text: part.replace(/^"|"$/g, "").trim() }))
    .filter(Boolean);

/** Tokenizes a GitHub-style query string (`type:"Conference" -status:Archived hello`). */
function parseQueryTokens<TRow>({
  q,
  qualifiers,
}: {
  q: string;
  qualifiers: readonly TableQualifier<TRow>[];
}): ParsedToken[] {
  const byWord = new Map<string, string>();
  for (const item of qualifiers) {
    byWord.set(fold({ text: item.key }), item.key);
    byWord.set(slugWord({ text: item.label }), item.key);
    byWord.set(fold({ text: item.label }), item.key);
  }
  const matches = q.match(/-?[^\s":]+:"[^"]*"|-?"[^"]+"|-?\S+/g) ?? [];
  return matches.flatMap((raw): ParsedToken[] => {
    const negated = raw.startsWith("-");
    const body = negated ? raw.slice(1) : raw;
    const colon = body.indexOf(":");
    if (colon > 0 && !body.startsWith('"')) {
      const key = byWord.get(fold({ text: body.slice(0, colon) }));
      const values = splitValues({ raw: body.slice(colon + 1) });
      if (key && values.length > 0) return [{ kind: "qualifier", key, values, negated }];
    }
    const value = fold({ text: body.replace(/^"|"$/g, "").trim() });
    return value ? [{ kind: "text", value, negated }] : [];
  });
}

function rowValues<TRow>({
  row,
  qualifier,
}: {
  row: TRow;
  qualifier: TableQualifier<TRow>;
}): string[] {
  const picked = qualifier.pick(row);
  if (picked == null) return [];
  const list = typeof picked === "string" ? [picked] : picked;
  return list.map((item) => fold({ text: item })).filter(Boolean);
}

export type FilterTableRowsInput<TRow> = {
  rows: readonly TRow[];
  q: string | undefined;
  qualifiers: readonly TableQualifier<TRow>[];
  getSearchText: (row: TRow) => string;
};

/** Filters rows by qualifier tokens (`key:value`, `-key:value`) and free-text search terms. */
export function filterTableRows<TRow>({
  rows,
  q,
  qualifiers,
  getSearchText,
}: FilterTableRowsInput<TRow>): TRow[] {
  if (!q?.trim()) return [...rows];
  const tokens = parseQueryTokens({ q, qualifiers });
  if (tokens.length === 0) return [...rows];
  const byKey = new Map(qualifiers.map((item) => [item.key, item]));
  return rows.filter((row) =>
    tokens.every((token) => {
      if (token.kind === "text") {
        const hay = fold({ text: getSearchText(row) });
        const hit = hay.includes(token.value);
        return token.negated ? !hit : hit;
      }
      const qualifier = byKey.get(token.key);
      if (!qualifier) return true;
      const candidateValues = rowValues({ row, qualifier });
      const hit = token.values.some((target) =>
        candidateValues.some((candidate) => candidate.includes(target)),
      );
      return token.negated ? !hit : hit;
    }),
  );
}
