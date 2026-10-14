"use client";

import { Button, FormControl, FormController, FormItem, FormLabel, Input } from "@okazi/ui";
import { SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";

export type VenueSearchFieldProps = { form: UseFormReturn<{ q: string }> };

/** The search input with a clear button (label for screen readers only). */
export function VenueSearchField({ form }: VenueSearchFieldProps) {
  const t = useTranslations("search");
  return (
    <FormController
      control={form.control}
      name="q"
      render={({ field }) => (
        <FormItem className="relative">
          <FormLabel className="sr-only">{t("label")}</FormLabel>
          <SearchIcon className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <FormControl>
            <Input
              type="search"
              placeholder={t("placeholder")}
              className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
              {...field}
            />
          </FormControl>
          {field.value ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              aria-label={t("clear")}
              onClick={() => form.setValue("q", "")}
            >
              <XIcon />
            </Button>
          ) : null}
        </FormItem>
      )}
    />
  );
}
