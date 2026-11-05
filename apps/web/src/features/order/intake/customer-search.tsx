import { Command, CommandGroup, CommandInput, CommandItem, CommandList, cn } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InlineLoadError } from "@/components/states/inline-load-error";
import type { CustomerOption } from "../../customer/actions";
import { useCustomerSearch } from "./use-customer-search";

export type CustomerSearchProps = {
  recent: CustomerOption[];
  /** True while the duplicate check for a new customer runs. */
  checking: boolean;
  /** The search text it starts with. */
  initialQuery?: string;
  onPick: (input: { customer: CustomerOption }) => void;
  onNew: (input: { name: string }) => void;
};

type ResultsProps = { heading: string; options: CustomerOption[] } & Pick<
  CustomerSearchProps,
  "onPick"
>;

function Results({ heading, options, onPick }: ResultsProps) {
  if (options.length === 0) return null;
  return (
    <CommandGroup heading={heading}>
      {options.map((customer) => (
        <CommandItem key={customer.id} value={customer.id} onSelect={() => onPick({ customer })}>
          {customer.name}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

type NewOptionProps = Pick<CustomerSearchProps, "checking" | "onNew"> & { text: string };

function NewOption({ text, checking, onNew }: NewOptionProps) {
  const t = useTranslations("orderIntake.who");
  if (!text) return null;
  return (
    <CommandGroup>
      <CommandItem value="__new" disabled={checking} onSelect={() => onNew({ name: text })}>
        <PlusIcon aria-hidden="true" />
        {t("newCustomer", { name: text })}
      </CommandItem>
    </CommandGroup>
  );
}

/**
 * Step 1's customer search: closed until focused, then the 5 recent customers while empty and
 * server matches with "+ New customer" while typing.
 */
export function CustomerSearch({ recent, checking, onPick, onNew, ...rest }: CustomerSearchProps) {
  const t = useTranslations("orderIntake.who");
  const [query, setQuery] = useState(rest.initialQuery ?? "");
  const [focused, setFocused] = useState(false);
  const { results, pending, errorKey } = useCustomerSearch({ query });
  const text = query.trim();
  const nothing = text !== "" && !pending && results.length === 0;
  const open = focused || text !== "";
  const closed = !open && "[&_[data-slot=command-input-wrapper]]:border-b-0";
  return (
    <div className="grid gap-2">
      <Command shouldFilter={false} className={cn("rounded-md border", closed)}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t("searchPlaceholder")}
        />
        {/* Keeps focus in the input so a click on an option is not lost to the blur. */}
        <CommandList hidden={!open} onMouseDown={(e) => e.preventDefault()}>
          <Results
            heading={text ? t("matches") : t("recent")}
            options={text ? results : recent}
            onPick={onPick}
          />
          {nothing ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{t("noMatches")}</p>
          ) : null}
          <NewOption text={text} checking={checking} onNew={onNew} />
        </CommandList>
      </Command>
      <InlineLoadError errorKey={errorKey} />
    </div>
  );
}
