import type { QueryRemote, QuerySuggestion, QueryTexts } from "./query-suggestion-types";
import { type QueryToken, quoteValue } from "./query-token";
import { fold, type QueryVocabulary } from "./query-vocabulary";

export type PeopleRowsInput = {
  token: QueryToken & { key: string; word: string };
  vocabulary: QueryVocabulary;
  texts: QueryTexts;
  members: QueryRemote["members"];
};

type SpecialInput = Omit<PeopleRowsInput, "members">;

const icon = ({ name }: { name: "none" | "some" | "me" | "exclude" }) =>
  ({ kind: "icon", icon: name }) as const;

/** No and any assignee (as `no:assignee`), only on a fresh, not negated `assignee:`. */
function emptyRows({ token, vocabulary, texts }: SpecialInput): QuerySuggestion[] {
  if (token.key !== "assignee" || token.negated || token.head) return [];
  if (!vocabulary.qualifiers.includes("no")) return [];
  const empty = `${vocabulary.words.no}:${vocabulary.empty.assignee}`;
  return [
    { id: "none", label: texts.noAssignee, visual: icon({ name: "none" }), text: empty },
    { id: "some", label: texts.hasAssignee, visual: icon({ name: "some" }), text: `-${empty}` },
  ];
}

/** The fixed rows above the members (GitHub style), those matching what is typed. */
function specialRows({ token, vocabulary, texts }: SpecialInput) {
  const { key, word, head, negated } = token;
  const me = vocabulary.values.me;
  const rows: QuerySuggestion[] = [
    ...emptyRows({ token, vocabulary, texts }),
    {
      id: "me",
      label: texts.me,
      detail: me,
      visual: icon({ name: "me" }),
      text: `${negated ? "-" : ""}${word}:${head}${me}`,
    },
  ];
  if (!negated && !head) {
    const exclude = { label: texts.exclude[key] ?? "", visual: icon({ name: "exclude" }) };
    rows.push({ id: "exclude", ...exclude, text: `-${word}:`, open: true });
  }
  const typed = fold({ text: token.partial });
  return rows.filter(
    ({ label, detail }) =>
      fold({ text: label }).includes(typed) || fold({ text: detail ?? "" }).startsWith(typed),
  );
}

/**
 * After `assignee:` or `follower:`: no or any assignee, me and exclude, then the members the
 * server found for what is typed, with their photo or initials.
 */
export function peopleRows({ members, ...input }: PeopleRowsInput): QuerySuggestion[] {
  const { word, head, negated } = input.token;
  const minus = negated ? "-" : "";
  const people = members.map((member) => ({
    id: `member:${member.userId}`,
    label: member.name,
    detail: member.email,
    visual: { kind: "avatar" as const, name: member.name, photoUrl: member.photoUrl },
    text: `${minus}${word}:${head}${quoteValue({ value: member.name })}`,
  }));
  return [...specialRows(input), ...people];
}
