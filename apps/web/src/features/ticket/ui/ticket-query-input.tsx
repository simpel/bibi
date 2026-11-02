import { cn, Input } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import type { SearchField } from "@/components/search-form";
import type { QueryCatalog, QuerySuggestion } from "../lib/query-suggestions";
import { useQuerySuggestions } from "./use-query-suggestions";

export type TicketQueryInputProps = SearchField &
  Omit<ComponentProps<"input">, keyof SearchField> & { catalog: QueryCatalog };

type RowProps = { suggestion: QuerySuggestion; id: string; active: boolean; onPick: () => void };

function SuggestionRow({ suggestion, id, active, onPick }: RowProps) {
  const t = useTranslations("ticket.qualifiers");
  const { key, value } = suggestion;
  return (
    <div
      id={id}
      role="option"
      tabIndex={-1}
      aria-selected={active}
      className={cn(
        "flex cursor-pointer items-baseline justify-between gap-3 rounded-sm px-2 py-1.5 text-sm",
        active && "bg-accent text-accent-foreground",
      )}
      // Keep focus in the input, so typing goes on after the pick.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPick}
      onKeyDown={(event) => {
        if (event.key === "Enter") onPick();
      }}
    >
      <span className="truncate font-mono">{value ?? `${key}:`}</span>
      {value === undefined ? (
        <span className="truncate text-xs text-muted-foreground">{t(key)}</span>
      ) : null}
    </div>
  );
}

type ListProps = Pick<
  ReturnType<typeof useQuerySuggestions>,
  "listId" | "items" | "active" | "pick"
>;

function SuggestionList({ listId, items, active, pick }: ListProps) {
  return (
    <div
      id={listId}
      role="listbox"
      className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
    >
      {items.map((suggestion, index) => (
        <SuggestionRow
          key={`${suggestion.key}:${suggestion.value ?? ""}`}
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
 * qualifier's values (the organization's own names), all filtered in the browser.
 */
export function TicketQueryInput({
  catalog,
  value,
  onChange,
  onBlur,
  ref: _ref,
  ...rest
}: TicketQueryInputProps) {
  const { inputProps, shown, ...list } = useQuerySuggestions({ value, onChange, onBlur, catalog });
  return (
    <div className="relative">
      <Input {...rest} {...inputProps} type="search" />
      {shown ? <SuggestionList {...list} /> : null}
    </div>
  );
}
