"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { SkillScopeChoice } from "../skill-types";

export type SkillScopeSelectProps = {
  id: string;
  value: SkillScopeChoice;
  onChange: (value: SkillScopeChoice) => void;
  disabled?: boolean;
};

/** Personal (just you) or organization (needs an admin): the scopes a user can write to. */
export function SkillScopeSelect({ id, value, onChange, disabled }: SkillScopeSelectProps) {
  const t = useTranslations("skills.scope");
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next === "ORGANIZATION" ? "ORGANIZATION" : "PERSONAL")}
      disabled={disabled}
    >
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PERSONAL">{t("personal")}</SelectItem>
        <SelectItem value="ORGANIZATION">{t("organization")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
