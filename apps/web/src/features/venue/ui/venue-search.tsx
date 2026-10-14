"use client";

import { Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useVenueSearch } from "./use-venue-search";
import { VenueSearchField } from "./venue-search-field";
import { VenueSearchResults } from "./venue-search-results";

/**
 * Semantic search box (core `search` operation) shown above the venue list. A search form
 * (CLAUDE.md "Formulär"): shadcn `Form`, results as you type, no submit action and no toast.
 */
export function VenueSearch() {
  const t = useTranslations("search");
  const form = useForm<{ q: string }>({ defaultValues: { q: "" } });
  const query = form.watch("q");
  const { hits, errorKey, pending } = useVenueSearch({ query });
  return (
    <search aria-label={t("label")}>
      <Form {...form}>
        <form className="grid gap-3" onSubmit={(event) => event.preventDefault()}>
          <VenueSearchField form={form} />
          <VenueSearchResults
            hits={hits}
            pending={pending}
            errorKey={errorKey}
            query={query.trim()}
          />
        </form>
      </Form>
    </search>
  );
}
