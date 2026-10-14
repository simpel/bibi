"use client";

import { Button, Input } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

export type RenameConversationFormProps = {
  title: string;
  onSubmit: (input: { title: string }) => void;
  onCancel: () => void;
};

/** Inline rename: Enter saves, Escape or Cancel leaves the title as it was. */
export function RenameConversationForm({ title, onSubmit, onCancel }: RenameConversationFormProps) {
  const t = useTranslations("assistant.history");
  const common = useTranslations("common");
  const [value, setValue] = useState(title);
  return (
    <form
      className="flex items-center gap-1 px-2 py-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim()) onSubmit({ title: value.trim() });
      }}
    >
      <Input
        value={value}
        maxLength={200}
        aria-label={t("renameLabel")}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && onCancel()}
      />
      <Button type="submit" size="sm" disabled={!value.trim()}>
        {common("save")}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
        {common("cancel")}
      </Button>
    </form>
  );
}
