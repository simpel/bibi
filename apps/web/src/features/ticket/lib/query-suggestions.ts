import { TICKET_QUALIFIERS, type TicketQualifier } from "@bibi/core/schemas";
import { fold, type QueryVocabulary, qualifierOf } from "./query-vocabulary";

/** Values offered per qualifier (names the caller may view), prepared on the server. */
export type QueryCatalog = Partial<Record<TicketQualifier, string[]>>;

/** A qualifier (`status:`, in the UI language) or one of its values (`Lead`). */
export type QuerySuggestion = { key: TicketQualifier; value?: string; label: string };

/** The word under the caret: `-status:Lead,Of` → key status, head `Lead,`, partial `Of`. */
export type QueryToken = {
  start: number;
  end: number;
  negated: boolean;
  key?: TicketQualifier;
  /** The qualifier word as typed (`ansvarig` or `assignee`). */
  word?: string;
  head: string;
  partial: string;
};

export type SuggestInput = {
  text: string;
  caret: number;
  catalog: QueryCatalog;
  vocabulary: QueryVocabulary;
  limit?: number;
};

type Bounds = Pick<SuggestInput, "text" | "caret">;
type TokenInput = Bounds & Pick<SuggestInput, "vocabulary">;

/** Where the word under the caret starts and ends; spaces inside quotes do not split it. */
function boundsAt({ text, caret }: Bounds) {
  let start = 0;
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '"') quoted = !quoted;
    if (text[index] !== " " || quoted) continue;
    if (index >= caret) return { start, end: index };
    start = index + 1;
  }
  return { start, end: text.length };
}

/** The token around the caret, split into its parts. */
export function tokenAt({ text, caret, vocabulary }: TokenInput): QueryToken {
  const { start, end } = boundsAt({ text, caret });
  const raw = text.slice(start, end);
  const negated = raw.startsWith("-");
  const body = negated ? raw.slice(1) : raw;
  const colon = body.indexOf(":");
  if (colon === -1) return { start, end, negated, head: "", partial: body };
  const word = body.slice(0, colon);
  const key = qualifierOf({ word, vocabulary });
  const values = body.slice(colon + 1);
  const comma = values.lastIndexOf(",") + 1;
  const partial = values.slice(comma).replace(/^"|"$/g, "");
  const named = key ? { key, word } : {};
  return { start, end, negated, ...named, head: values.slice(0, comma), partial };
}

const rank = ({ option, partial }: { option: string; partial: string }) =>
  fold({ text: option }).startsWith(partial) ? 0 : 1;

/** The qualifier's values that contain what is typed, those starting with it first. */
type ValueInput = Pick<SuggestInput, "catalog"> & {
  key: TicketQualifier;
  partial: string;
  limit: number;
};

function valueSuggestions({ key, partial, catalog, limit }: ValueInput): QuerySuggestion[] {
  const typed = fold({ text: partial });
  const matches = (catalog[key] ?? [])
    .filter((option) => fold({ text: option }).includes(typed))
    .sort((a, b) => rank({ option: a, partial: typed }) - rank({ option: b, partial: typed }))
    .slice(0, limit);
  const done = matches.length === 1 && fold({ text: matches[0] ?? "" }) === typed;
  return done ? [] : matches.map((value) => ({ key, value, label: value }));
}

type KeyInput = Pick<SuggestInput, "vocabulary"> & { partial: string; limit: number };

/** Qualifiers whose word (UI language or English) starts with what is typed, shown in the UI's. */
function keySuggestions({ partial, vocabulary, limit }: KeyInput): QuerySuggestion[] {
  const typed = fold({ text: partial });
  const starts = ({ word }: { word: string }) =>
    fold({ text: word }).startsWith(typed) && fold({ text: word }) !== typed;
  return TICKET_QUALIFIERS.filter(
    (key) => starts({ word: vocabulary.words[key] }) || starts({ word: key }),
  )
    .slice(0, limit)
    .map((key) => ({ key, label: `${vocabulary.words[key]}:` }));
}

/**
 * What to offer while typing: qualifiers that start with the word (all of them in an empty
 * search), or the values of the qualifier being typed. Free text gets nothing.
 */
export function suggest({ text, caret, catalog, vocabulary, limit = 8 }: SuggestInput) {
  const token = tokenAt({ text, caret, vocabulary });
  const raw = text.slice(token.start, token.end);
  if (token.key) {
    return {
      token,
      items: valueSuggestions({ key: token.key, partial: token.partial, catalog, limit }),
    };
  }
  if (raw.includes(":") || (raw === "" && text.trim() !== "")) return { token, items: [] };
  return { token, items: keySuggestions({ partial: token.partial, vocabulary, limit }) };
}

export type ApplyInput = {
  text: string;
  token: QueryToken;
  suggestion: QuerySuggestion;
};

/** The search with the token replaced, and where the caret goes. Values end with a space. */
export function applySuggestion({ text, token, suggestion }: ApplyInput) {
  const { value, label } = suggestion;
  const minus = token.negated ? "-" : "";
  const quoted = value?.includes(" ") ? `"${value}"` : value;
  const word =
    value === undefined ? `${minus}${label}` : `${minus}${token.word}:${token.head}${quoted}`;
  const rest = text.slice(token.end);
  const space = value !== undefined && !rest.startsWith(" ") ? " " : "";
  const next = `${text.slice(0, token.start)}${word}${space}${rest}`;
  return { text: next, caret: token.start + word.length + space.length };
}
