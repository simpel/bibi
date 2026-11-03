import { peopleRows } from "./query-people-rows";
import type {
  QueryCatalog,
  QueryRemote,
  QuerySuggestion,
  QueryTexts,
} from "./query-suggestion-types";
import { type QueryToken, quoteValue, tokenAt } from "./query-token";
import { fold, type QueryVocabulary } from "./query-vocabulary";

export type SuggestInput = {
  text: string;
  caret: number;
  catalog: QueryCatalog;
  vocabulary: QueryVocabulary;
  texts: QueryTexts;
  remote: QueryRemote;
  limit?: number;
};

/** Which server search a qualifier's values come from, if any. */
/** People qualifiers: their values are members, with special rows above. */
export const PEOPLE_QUALIFIERS: readonly string[] = ["assignee", "follower", "involves"];

export const remoteOf = ({ key }: { key: string | undefined }) =>
  key && PEOPLE_QUALIFIERS.includes(key) ? "members" : key === "customer" ? "customers" : null;

type Named = { token: QueryToken & { key: string; word: string } };

/** Values from the catalog or the customer search that contain what is typed. */
function valueRows({
  token,
  catalog,
  remote,
  limit,
}: Named & Omit<SuggestInput, "text" | "caret" | "vocabulary" | "texts">) {
  const typed = fold({ text: token.partial });
  const options =
    token.key === "customer"
      ? remote.customers.map(({ name }) => name)
      : (catalog[token.key] ?? []);
  const rank = ({ option }: { option: string }) =>
    fold({ text: option }).startsWith(typed) ? 0 : 1;
  const matches = options
    .filter((option) => fold({ text: option }).includes(typed))
    .sort((a, b) => rank({ option: a }) - rank({ option: b }))
    .slice(0, limit);
  if (matches.length === 1 && fold({ text: matches[0] ?? "" }) === typed) return [];
  const minus = token.negated ? "-" : "";
  return matches.map((value) => ({
    id: `value:${value}`,
    label: value,
    visual: { kind: "icon" as const, icon: token.key },
    text: `${minus}${token.word}:${token.head}${quoteValue({ value })}`,
  }));
}

/** Qualifiers whose word (UI language or English) or label starts with what is typed. */
function keyRows({
  token,
  vocabulary,
  texts,
}: { token: QueryToken } & Pick<SuggestInput, "vocabulary" | "texts">) {
  const typed = fold({ text: token.partial });
  const starts = ({ word }: { word: string }) => fold({ text: word }).startsWith(typed);
  const minus = token.negated ? "-" : "";
  return vocabulary.qualifiers
    .filter((key) =>
      [vocabulary.words[key] ?? key, key, texts.labels[key] ?? key].some((word) =>
        starts({ word }),
      ),
    )
    .map((key) => ({
      id: `key:${key}`,
      label: texts.labels[key] ?? key,
      detail: texts.hints[key],
      visual: { kind: "icon" as const, icon: key },
      text: `${minus}${vocabulary.words[key] ?? key}:`,
      open: true,
    }));
}

/**
 * The dropdown's rows: qualifiers while typing a word (all of them in an empty search), then the
 * qualifier's values, people and customers from the server search. Free text gets nothing.
 */
export function suggest({ limit = 8, ...input }: SuggestInput): {
  token: QueryToken;
  items: QuerySuggestion[];
} {
  const token = tokenAt(input);
  const { key, word } = token;
  if (key && word && PEOPLE_QUALIFIERS.includes(key)) {
    return {
      token,
      items: peopleRows({
        ...input,
        token: { ...token, key, word },
        members: input.remote.members,
      }),
    };
  }
  if (key && word)
    return { token, items: valueRows({ ...input, token: { ...token, key, word }, limit }) };
  if (token.raw.includes(":") || (token.raw === "" && input.text.trim() !== ""))
    return { token, items: [] };
  return { token, items: keyRows({ ...input, token }) };
}

export type ApplyInput = { text: string; token: QueryToken; suggestion: QuerySuggestion };

/** The search with the word under the caret replaced, and where the caret goes. */
export function applySuggestion({ text, token, suggestion }: ApplyInput) {
  const rest = text.slice(token.end);
  const space = suggestion.open || rest.startsWith(" ") ? "" : " ";
  const next = `${text.slice(0, token.start)}${suggestion.text}${space}${rest}`;
  return { text: next, caret: token.start + suggestion.text.length + space.length };
}
