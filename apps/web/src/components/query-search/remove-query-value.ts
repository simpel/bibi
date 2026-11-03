import type { KeyboardEvent } from "react";
import { withoutValueAt } from "./lib/query-backspace";
import type { QueryVocabulary } from "./lib/query-vocabulary";

export type RemoveQueryValueInput = {
  event: KeyboardEvent<HTMLInputElement>;
  vocabulary: QueryVocabulary;
  onChange: (value: string) => void;
};

/** Backspace right after a highlighted value removes the whole value; true when it did. */
export function removeQueryValue({ event, vocabulary, onChange }: RemoveQueryValueInput) {
  const field = event.currentTarget;
  const { selectionStart: caret, selectionEnd } = field;
  if (event.key !== "Backspace" || caret === null || caret !== selectionEnd) return false;
  const next = withoutValueAt({ text: field.value, caret, vocabulary });
  if (!next) return false;
  event.preventDefault();
  onChange(next.text);
  // The caret moves after React renders the shorter value; its `select` reopens the values.
  requestAnimationFrame(() => field.setSelectionRange(next.caret, next.caret));
  return true;
}
