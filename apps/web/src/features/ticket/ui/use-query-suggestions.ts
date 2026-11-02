import { type KeyboardEvent, type RefObject, useId, useMemo, useRef, useState } from "react";
import type { QueryCatalog, QuerySuggestion } from "../lib/query-suggestion-types";
import { applySuggestion, suggest } from "../lib/query-suggestions";
import type { QueryVocabulary } from "../lib/query-vocabulary";
import { useQueryRemote } from "./use-query-remote";
import { useQueryTexts } from "./use-query-texts";

export type UseQuerySuggestionsInput = {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  catalog: QueryCatalog;
  vocabulary: QueryVocabulary;
};

type Position = { currentTarget: HTMLInputElement };

/**
 * The suggestions' state and the combobox props of the input. Arrows move, Tab or Enter on a
 * highlighted row picks it (a value also submits the search), Escape closes; Enter with nothing
 * highlighted submits the search.
 */
export function useQuerySuggestions({
  value,
  onChange,
  onBlur,
  catalog,
  vocabulary,
}: UseQuerySuggestionsInput) {
  const listId = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [caret, setCaret] = useState(value.length);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const texts = useQueryTexts();
  const remote = useQueryRemote({ text: value, caret, vocabulary, open });
  const { token, items } = useMemo(
    () => suggest({ text: value, caret, catalog, vocabulary, texts, remote }),
    [value, caret, catalog, vocabulary, texts, remote],
  );
  const shown = open && items.length > 0;
  const pick = ({ suggestion }: { suggestion: QuerySuggestion }) => {
    const next = applySuggestion({ text: value, token, suggestion });
    onChange(next.text);
    setActive(-1);
    // A picked value completes a filter: search at once. A key waits for its value.
    setOpen(Boolean(suggestion.open));
    setCaret(next.caret);
    requestAnimationFrame(() => {
      ref.current?.setSelectionRange(next.caret, next.caret);
      if (!suggestion.open) ref.current?.form?.requestSubmit();
    });
  };
  const track = ({ currentTarget }: Position) => {
    setCaret(currentTarget.selectionStart ?? currentTarget.value.length);
    setOpen(true);
  };
  const keys = { shown, items, active, setActive, setOpen, pick };
  const combobox = { listId, ref, value, shown, active, keys };
  const inputProps = comboboxProps({ ...combobox, onChange, onBlur, track, setOpen });
  return { listId, items, active, shown, pick, inputProps };
}

type ComboboxPropsInput = {
  listId: string;
  ref: RefObject<HTMLInputElement | null>;
  value: string;
  shown: boolean;
  active: number;
  keys: Omit<HandleKeyInput, "event">;
  onChange: (value: string) => void;
  onBlur: () => void;
  track: (input: Position) => void;
  setOpen: (open: boolean) => void;
};

/** The input's combobox props (ARIA and handlers), wired to the suggestions. */
function comboboxProps({ listId, shown, active, keys, track, ...input }: ComboboxPropsInput) {
  return {
    ref: input.ref,
    value: input.value,
    role: "combobox",
    autoComplete: "off",
    "aria-expanded": shown,
    "aria-controls": listId,
    "aria-autocomplete": "list" as const,
    ...(shown && active >= 0 ? { "aria-activedescendant": `${listId}-${active}` } : {}),
    onChange: (event: Position) => {
      input.onChange(event.currentTarget.value);
      track(event);
    },
    onSelect: track,
    onFocus: track,
    onBlur: () => {
      input.setOpen(false);
      input.onBlur();
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => handleKey({ event, ...keys }),
  };
}

type HandleKeyInput = {
  event: KeyboardEvent<HTMLInputElement>;
  shown: boolean;
  items: QuerySuggestion[];
  active: number;
  setActive: (index: number) => void;
  setOpen: (open: boolean) => void;
  pick: (input: { suggestion: QuerySuggestion }) => void;
};

function handleKey({ event, shown, items, active, setActive, setOpen, pick }: HandleKeyInput) {
  if (!shown) return;
  const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
  if (step !== undefined) {
    event.preventDefault();
    setActive((active + step + items.length) % items.length);
    return;
  }
  const chosen = items[active] ?? (event.key === "Tab" ? items[0] : undefined);
  if ((event.key === "Enter" || event.key === "Tab") && chosen) {
    event.preventDefault();
    pick({ suggestion: chosen });
  } else if (event.key === "Escape") {
    event.preventDefault();
    setOpen(false);
  }
}
