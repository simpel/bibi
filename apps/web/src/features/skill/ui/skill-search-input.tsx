"use client";

import { Input } from "@okazi/ui";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type SkillSearchInputProps = { value: string; onChange: (value: string) => void };

export function SkillSearchInput({ value, onChange }: SkillSearchInputProps) {
  const t = useTranslations("skills.filters");
  return (
    <div className="relative min-w-48 flex-1">
      <SearchIcon className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("query")}
        className="pl-9"
      />
    </div>
  );
}
