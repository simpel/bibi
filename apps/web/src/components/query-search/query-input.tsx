import { cn, Input } from "@bibi/ui";
import type { ComponentProps } from "react";
import type { SearchField } from "@/components/search-form";
import type { QueryCatalog, QueryTexts } from "./lib/query-suggestion-types";
import type { QueryVocabulary } from "./lib/query-vocabulary";
import { QueryHighlight } from "./query-highlight";
import { QuerySuggestionRow } from "./query-suggestion-row";
import { useQuerySuggestions } from "./use-query-suggestions";

export type QueryInputProps = SearchField &
  Omit<ComponentProps<"input">, keyof SearchField> & {
    catalog: QueryCatalog;
    vocabulary: QueryVocabulary;
    texts: QueryTexts;
  };

type ListProps = Pick<
  ReturnType<typeof useQuerySuggestions>,
  "listId" | "items" | "active" | "pick"
>;

function SuggestionList({ listId, items, active, pick }: ListProps) {
  return (
    <div
      id={listId}
      role="listbox"
      className="absolute z-50 mt-1 max-h-80 w-full min-w-72 overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
    >
      {items.map((suggestion, index) => (
        <QuerySuggestionRow
          key={suggestion.id}
          suggestion={suggestion}
          id={`${listId}-${index}`}
          active={index === active}
          onPick={() => pick({ suggestion })}
        />
      ))}
    </div>
  );
}

/**
 * A list's search with GitHub-style suggestions: qualifiers while typing a word, then the
 * qualifier's values; members and customers are searched on the server as you type. Known
 * qualifiers' values are highlighted in the field itself.
 */
export function QueryInput({
  catalog,
  vocabulary,
  texts,
  value,
  onChange,
  onBlur,
  ref: _ref,
  ...rest
}: QueryInputProps) {
  const { inputProps, shown, ...list } = useQuerySuggestions({
    value,
    onChange,
    onBlur,
    catalog,
    vocabulary,
    texts,
  });
  return (
    // The group rounds this wrapper; the highlight and the input follow its corners.
    <div className="relative flex-1 rounded-md bg-background">
      <QueryHighlight value={value} vocabulary={vocabulary} input={inputProps.ref} />
      <Input
        {...rest}
        {...inputProps}
        type="search"
        // The text is drawn by the highlight underneath; the caret and selection stay the input's.
        className={cn(
          "relative rounded-[inherit] bg-transparent text-transparent caret-foreground",
          rest.className,
        )}
      />
      {shown ? <SuggestionList {...list} /> : null}
    </div>
  );
}
