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
  Spinner,
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
  /** A search is on its way: the button is disabled, with a spinner for its icon. */
  pending?: boolean;
  /** The spinner's accessible name, e.g. "Searching…". */
  pendingLabel?: string;
  /** Replaces the plain text input, e.g. with one that suggests filters while typing. */
  renderInput?: (field: SearchField) => ReactNode;
};

type SearchValues = { q: string };

/** The field's react-hook-form props plus its placeholder. */
export type SearchField = ControllerRenderProps<SearchValues, "q"> & { placeholder: string };

type SearchButtonProps = Pick<SearchFormProps, "submitLabel" | "pending" | "pendingLabel">;

/** The submit button: disabled while a search is on its way, a spinner for its icon. */
function SearchButton({ submitLabel, pending = false, pendingLabel }: SearchButtonProps) {
  return (
    <Button type="submit" variant="outline" size="icon" aria-label={submitLabel} disabled={pending}>
      {pending ? <Spinner label={pendingLabel ?? submitLabel} /> : <SearchIcon />}
    </Button>
  );
}

/**
 * Free-text search of a list, the field and its button joined (shadcn Button Group), applied on
 * submit (Enter), not per keystroke, so a large list is queried once. A navigation form
 * (CLAUDE.md "Forms"): no server action.
 */
export function SearchForm({ value, label, onSearch, renderInput, ...button }: SearchFormProps) {
  const form = useForm<SearchValues>({ defaultValues: { q: value ?? "" } });
  // react-hook-form store: the field follows the URL's `q`.
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
                  <SearchButton {...button} />
                </ButtonGroup>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </search>
  );
}
