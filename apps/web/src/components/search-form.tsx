"use client";

import {
  Button,
  ButtonGroup,
  Form,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  Input,
} from "@bibi/ui";
import { SearchIcon } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { type ControllerRenderProps, useForm } from "react-hook-form";

export type SearchFormProps = {
  value: string | undefined;
  /** Placeholder and accessible name of the field. */
  label: string;
  /** Accessible name of the submit button. */
  submitLabel: string;
  onSearch: (q: string | null) => void;
  /** Replaces the plain text input, e.g. with one that suggests filters while typing. */
  renderInput?: (field: SearchField) => ReactNode;
};

type SearchValues = { q: string };

/** The field's react-hook-form props plus its placeholder. */
export type SearchField = ControllerRenderProps<SearchValues, "q"> & { placeholder: string };

/**
 * Free-text search of a list, the field and its button joined (shadcn Button Group), applied on
 * submit (Enter), not per keystroke, so a large list is queried once. A navigation form (CLAUDE.md "Forms"): no server action and no toast.
 */
export function SearchForm({ value, label, submitLabel, onSearch, renderInput }: SearchFormProps) {
  const form = useForm<SearchValues>({ defaultValues: { q: value ?? "" } });
  useEffect(() => form.reset({ q: value ?? "" }), [form, value]);
  return (
    <search className="flex w-full sm:w-96">
      <Form {...form}>
        <form
          className="flex flex-1"
          onSubmit={form.handleSubmit(({ q }) => onSearch(q.trim() || null))}
        >
          <FormController
            control={form.control}
            name="q"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="sr-only">{label}</FormLabel>
                <ButtonGroup className="w-full">
                  <FormControl>
                    {renderInput ? (
                      renderInput({ ...field, placeholder: label })
                    ) : (
                      <Input type="search" placeholder={label} {...field} />
                    )}
                  </FormControl>
                  <Button type="submit" variant="outline" size="icon" aria-label={submitLabel}>
                    <SearchIcon />
                  </Button>
                </ButtonGroup>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </search>
  );
}
