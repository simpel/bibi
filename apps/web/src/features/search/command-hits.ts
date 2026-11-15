import { fold } from "@/components/query-search/lib/query-vocabulary";

/** One record the command bar found: its name, an optional detail (`#34`) and its page. */
export type CommandHit = { id: string; title: string; detail: string | null; href: string };

/** What a prefix search found; `more` says there are further matches than `hits`. */
export type CommandLookup = { hits: CommandHit[]; more: boolean };

export type MatchByNameInput = {
  rows: readonly { id: string; name: string }[];
  text: string;
  shown: number;
  href: (input: { id: string }) => string;
};

/** The rows whose name contains `text`, case and diacritics ignored; at most `shown`. */
export function matchByName({ rows, text, shown, href }: MatchByNameInput): CommandLookup {
  const needle = fold({ text: text.trim() });
  const found = rows.filter((row) => fold({ text: row.name }).includes(needle));
  const hits = found
    .slice(0, shown)
    .map(({ id, name }) => ({ id, title: name, detail: null, href: href({ id }) }));
  return { hits, more: found.length > shown };
}
