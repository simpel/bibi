import { Input } from "@bibi/ui";
import type { ComponentProps } from "react";
import type { SearchField } from "@/components/search-form";
import type { QueryCatalog } from "../lib/query-suggestion-types";
import type { QueryVocabulary } from "../lib/query-vocabulary";
import { QuerySuggestionRow } from "./query-suggestion-row";
import { useQuerySuggestions } from "./use-query-suggestions";

export type TicketQueryInputProps = SearchField &
  Omit<ComponentProps<"input">, keyof SearchField> & {
    catalog: QueryCatalog;
    vocabulary: QueryVocabulary;
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
 * The tickets search with GitHub-style suggestions: qualifiers while typing a word, then the
 * qualifier's values; members and customers are searched on the server as you type.
 */
export function TicketQueryInput({
  catalog,
  vocabulary,
  value,
  onChange,
  onBlur,
  ref: _ref,
  ...rest
}: TicketQueryInputProps) {
  const { inputProps, shown, ...list } = useQuerySuggestions({
    value,
    onChange,
    onBlur,
    catalog,
    vocabulary,
  });
  return (
    <div className="relative">
      <Input {...rest} {...inputProps} type="search" />
      {shown ? <SuggestionList {...list} /> : null}
    </div>
  );
}
