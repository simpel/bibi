"use client";

import { Button, Form, FormControl, FormController, FormItem, FormLabel, Input } from "@bibi/ui";
import { SearchIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

export type SearchFormProps = {
  value: string | undefined;
  /** Placeholder and accessible name of the field. */
  label: string;
  /** Accessible name of the submit button. */
  submitLabel: string;
  onSearch: (q: string | null) => void;
};

type SearchValues = { q: string };

/**
 * Free-text search of a list, applied on submit (Enter), not per keystroke, so a large list is
 * queried once. A navigation form (CLAUDE.md "Forms"): no server action and no toast.
 */
export function SearchForm({ value, label, submitLabel, onSearch }: SearchFormProps) {
  const form = useForm<SearchValues>({ defaultValues: { q: value ?? "" } });
  useEffect(() => form.reset({ q: value ?? "" }), [form, value]);
  return (
    <search className="flex w-full sm:w-80">
      <Form {...form}>
        <form
          className="flex flex-1 gap-2"
          onSubmit={form.handleSubmit(({ q }) => onSearch(q.trim() || null))}
        >
          <FormController
            control={form.control}
            name="q"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="sr-only">{label}</FormLabel>
                <FormControl>
                  <Input type="search" placeholder={label} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" variant="secondary" size="icon" aria-label={submitLabel}>
            <SearchIcon />
          </Button>
        </form>
      </Form>
    </search>
  );
}
