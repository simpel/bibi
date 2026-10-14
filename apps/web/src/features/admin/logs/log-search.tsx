"use client";

import { Button, Form, FormControl, FormController, FormItem, FormLabel, Input } from "@okazi/ui";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

export type LogSearchProps = { value: string | undefined; onSearch: (q: string | null) => void };

type SearchValues = { q: string };

/**
 * Free-text search; applied on submit (Enter), not per keystroke. A navigation form
 * (CLAUDE.md "Formulär"): shadcn `Form`, no server action and no toast.
 */
export function LogSearch({ value, onSearch }: LogSearchProps) {
  const t = useTranslations("admin.logs.filters");
  const form = useForm<SearchValues>({ defaultValues: { q: value ?? "" } });
  useEffect(() => form.reset({ q: value ?? "" }), [form, value]);
  return (
    <search className="flex min-w-64 flex-1">
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
                <FormLabel className="sr-only">{t("search")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("search")} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" variant="secondary" size="icon" aria-label={t("apply")}>
            <SearchIcon />
          </Button>
        </form>
      </Form>
    </search>
  );
}
