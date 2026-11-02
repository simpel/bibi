import { TICKET_QUALIFIERS, type TicketQualifier } from "@bibi/core/schemas";

/** Values offered per qualifier (names the caller may view), prepared on the server. */
export type QueryCatalog = Partial<Record<TicketQualifier, string[]>>;

/** A qualifier (`status:`) or one of its values (`Lead`). */
export type QuerySuggestion = { key: TicketQualifier; value?: string };

/** The word under the caret: `-status:Lead,Of` → key status, head `Lead,`, partial `Of`. */
export type QueryToken = {
  start: number;
  end: number;
  negated: boolean;
  key?: TicketQualifier;
  head: string;
  partial: string;
};

export type SuggestInput = { text: string; caret: number; catalog: QueryCatalog; limit?: number };

type Bounds = Pick<SuggestInput, "text" | "caret">;

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
export function tokenAt({ text, caret }: Bounds): QueryToken {
  const { start, end } = boundsAt({ text, caret });
  const raw = text.slice(start, end);
  const negated = raw.startsWith("-");
  const body = negated ? raw.slice(1) : raw;
  const colon = body.indexOf(":");
  if (colon === -1) return { start, end, negated, head: "", partial: body };
  const key = TICKET_QUALIFIERS.find((name) => name === body.slice(0, colon).toLowerCase());
  const values = body.slice(colon + 1);
  const comma = values.lastIndexOf(",") + 1;
  const partial = values.slice(comma).replace(/^"|"$/g, "");
  return { start, end, negated, ...(key ? { key } : {}), head: values.slice(0, comma), partial };
}

const rank = ({ option, partial }: { option: string; partial: string }) =>
  option.toLowerCase().startsWith(partial) ? 0 : 1;

/** The qualifier's values that contain what is typed, those starting with it first. */
function valueSuggestions({ key, partial, catalog, limit }: Required<QueryToken & SuggestInput>) {
  const typed = partial.toLowerCase();
  const matches = (catalog[key] ?? [])
    .filter((option) => option.toLowerCase().includes(typed))
    .sort((a, b) => rank({ option: a, partial: typed }) - rank({ option: b, partial: typed }))
    .slice(0, limit);
  const done = matches.length === 1 && matches[0]?.toLowerCase() === typed;
  return done ? [] : matches.map((value) => ({ key, value }));
}

/**
 * What to offer while typing: qualifiers that start with the word (all of them in an empty
 * search), or the values of the qualifier being typed. Free text gets nothing.
 */
export function suggest({ text, caret, catalog, limit = 8 }: SuggestInput) {
  const token = tokenAt({ text, caret });
  const raw = text.slice(token.start, token.end);
  if (token.key) {
    const items = valueSuggestions({ ...token, key: token.key, text, caret, catalog, limit });
    return { token, items: items as QuerySuggestion[] };
  }
  if (raw.includes(":") || (raw === "" && text.trim() !== "")) return { token, items: [] };
  const typed = token.partial.toLowerCase();
  const items = TICKET_QUALIFIERS.filter((key) => key.startsWith(typed) && key !== typed);
  return { token, items: items.slice(0, limit).map((key) => ({ key })) as QuerySuggestion[] };
}

export type ApplyInput = { text: string; token: QueryToken; suggestion: QuerySuggestion };

/** The search with the token replaced, and where the caret goes. Values end with a space. */
export function applySuggestion({ text, token, suggestion }: ApplyInput) {
  const { key, value } = suggestion;
  const minus = token.negated ? "-" : "";
  const quoted = value?.includes(" ") ? `"${value}"` : value;
  const word = value === undefined ? `${minus}${key}:` : `${minus}${key}:${token.head}${quoted}`;
  const rest = text.slice(token.end);
  const space = value !== undefined && !rest.startsWith(" ") ? " " : "";
  const next = `${text.slice(0, token.start)}${word}${space}${rest}`;
  return { text: next, caret: token.start + word.length + space.length };
}
