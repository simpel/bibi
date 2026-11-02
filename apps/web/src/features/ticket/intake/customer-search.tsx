import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@bibi/ui";
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

/** Step 1's customer search: the latest customers while empty, server matches while typing. */
export function CustomerSearch({ recent, checking, onPick, onNew }: CustomerSearchProps) {
  const t = useTranslations("ticketIntake.who");
  const [query, setQuery] = useState("");
  const { results, pending, errorKey } = useCustomerSearch({ query });
  const text = query.trim();
  const nothing = text ? !pending && results.length === 0 : recent.length === 0;
  return (
    <div className="grid gap-2">
      <Command shouldFilter={false} className="rounded-md border">
        <CommandInput value={query} onValueChange={setQuery} placeholder={t("searchPlaceholder")} />
        <CommandList>
          <Results
            heading={text ? t("matches") : t("recent")}
            options={text ? results : recent}
            onPick={onPick}
          />
          {nothing ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {text ? t("noMatches") : t("typeToSearch")}
            </p>
          ) : null}
          {text ? (
            <CommandGroup>
              <CommandItem value="__new" disabled={checking} onSelect={() => onNew({ name: text })}>
                <PlusIcon aria-hidden="true" />
                {t("newCustomer", { name: text })}
              </CommandItem>
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
      <InlineLoadError errorKey={errorKey} />
    </div>
  );
}
