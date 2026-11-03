import { queryParts } from "./query-highlight";
import type { QueryVocabulary } from "./query-vocabulary";

export type WithoutValueAtInput = { text: string; caret: number; vocabulary: QueryVocabulary };

/**
 * Backspace on a highlighted value removes all of it, GitHub style: when the caret sits right
 * after a known qualifier's value, the search without that value and the caret where it began.
 * Null anywhere else, so Backspace deletes one character as usual.
 */
export function withoutValueAt({ text, caret, vocabulary }: WithoutValueAtInput) {
  let at = 0;
  for (const part of queryParts({ text, vocabulary })) {
    at += part.text.length;
    if (at === caret && part.kind === "value" && part.text) {
      const start = at - part.text.length;
      return { text: text.slice(0, start) + text.slice(at), caret: start };
    }
    if (at >= caret) return null;
  }
  return null;
}
