/** A colleague who can be mentioned: their user id and display name. */
export type Mentionable = { userId: string; name: string };

/** Longest text after `@` still treated as a name being typed. */
const MAX_QUERY = 40;

export type ActiveMentionInput = { text: string; caret: number };

/**
 * The `@name` being typed at the caret: where its `@` is and what follows it, or null. The `@`
 * starts the text or follows white space, and the query has no line break.
 */
export function activeMention({ text, caret }: ActiveMentionInput) {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  if (at > 0 && !/\s/.test(before[at - 1] ?? "")) return null;
  const query = before.slice(at + 1);
  if (query.length > MAX_QUERY || query.includes("\n")) return null;
  return { start: at, query };
}

export type InsertMentionInput = { text: string; start: number; caret: number; name: string };

/** Replaces the typed `@query` with `@Name ` and puts the caret after it. */
export function insertMention({ text, start, caret, name }: InsertMentionInput) {
  const inserted = `@${name} `;
  return {
    text: text.slice(0, start) + inserted + text.slice(caret),
    caret: start + inserted.length,
  };
}

export type MatchPeopleInput = { people: readonly Mentionable[]; query: string; limit?: number };

/** People whose name has a word starting with the query, in their order, at most `limit`. */
export function matchPeople({ people, query, limit = 6 }: MatchPeopleInput): Mentionable[] {
  const q = query.trim().toLocaleLowerCase();
  const fits = ({ name }: Mentionable) =>
    q === "" ||
    name.toLocaleLowerCase().startsWith(q) ||
    name
      .toLocaleLowerCase()
      .split(/\s+/)
      .some((word) => word.startsWith(q));
  return people.filter((person) => fits(person)).slice(0, limit);
}

export type MentionedIdsInput = { text: string; people: readonly Mentionable[] };

/** The people whose `@Name` is in the text, each once: what the comment mentions. */
export function mentionedIds({ text, people }: MentionedIdsInput): string[] {
  return [...new Set(people.filter((p) => text.includes(`@${p.name}`)).map((p) => p.userId))];
}

/** The value with every regular-expression character escaped. */
function escapeRegExp({ value }: { value: string }) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type Segment = { text: string; mention: boolean };

export type SplitMentionsInput = { text: string; names: readonly string[] };

/** The text cut into plain parts and `@Name` parts for the given names, longest names first. */
export function splitMentions({ text, names }: SplitMentionsInput): Segment[] {
  const tokens = [...new Set(names)].filter(Boolean).sort((a, b) => b.length - a.length);
  if (tokens.length === 0) return [{ text, mention: false }];
  const alternatives = tokens.map((name) => `@${escapeRegExp({ value: name })}`).join("|");
  const pattern = new RegExp(`(${alternatives})`, "g");
  return text
    .split(pattern)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, mention: tokens.some((name) => part === `@${name}`) }));
}
