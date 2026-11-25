import { NOTIFICATION_KINDS, type NotificationKind } from "@bibi/core/schemas";
import { fold } from "@/components/query-search/lib/query-vocabulary";

export type NotificationKindLabels = Record<NotificationKind, string>;

export type SplitNotificationQueryInput = {
  q: string;
  /** The kinds' names in the UI language (what the search suggests). */
  labels: NotificationKindLabels;
  /** The qualifier's word in the UI language (`type`, `typ`). */
  word: string;
};

export type SplitNotificationQuery = { text: string; kind: NotificationKind | undefined };

const TOKEN = /-?[^\s":]+:"[^"]*"|-?"[^"]+"|-?\S+/g;
const unquote = ({ value }: { value: string }) => value.replace(/^"|"$/g, "").trim();

/**
 * Splits the panel's search into free text and a `kind:` filter (`kind:"Comment" budget`). The
 * qualifier is the canonical `kind` or the UI language's word; the value, a kind's name or id.
 * The first known value wins; anything else stays in the text.
 */
export function splitNotificationQuery({ q, labels, word }: SplitNotificationQueryInput) {
  const words = new Set(["kind", fold({ text: word })]);
  const text: string[] = [];
  let kind: NotificationKind | undefined;
  for (const raw of q.match(TOKEN) ?? []) {
    const colon = raw.indexOf(":");
    const key = colon > 0 && !raw.startsWith("-") ? fold({ text: raw.slice(0, colon) }) : "";
    if (!words.has(key)) {
      text.push(raw);
      continue;
    }
    for (const part of raw.slice(colon + 1).split(",")) {
      const typed = fold({ text: unquote({ value: part }) });
      kind ??= NOTIFICATION_KINDS.find(
        (value) => fold({ text: value }) === typed || fold({ text: labels[value] }) === typed,
      );
    }
  }
  return { text: text.join(" "), kind } satisfies SplitNotificationQuery;
}
