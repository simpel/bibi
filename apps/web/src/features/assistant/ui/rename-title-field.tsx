"use client";

import { FormControl, FormController, FormItem, FormLabel, FormMessage, Input } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { RenameInput, RenameValues } from "./use-rename-conversation-form";

export type RenameTitleFieldProps = {
  form: UseFormReturn<RenameValues, unknown, RenameInput>;
  onCancel: () => void;
};

/** The title input of the inline rename form; Escape cancels. */
export function RenameTitleField({ form, onCancel }: RenameTitleFieldProps) {
  const t = useTranslations("assistant.history");
  return (
    <FormController
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem className="flex-1">
          <FormLabel className="sr-only">{t("renameLabel")}</FormLabel>
          <FormControl>
            <Input
              maxLength={200}
              onKeyDown={(event) => event.key === "Escape" && onCancel()}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
