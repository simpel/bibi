"use client";

import {
  FormControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { SkillScopeChoice } from "../skill-types";

export type SkillScopeSelectProps = {
  value: SkillScopeChoice;
  onChange: (value: SkillScopeChoice) => void;
  disabled?: boolean;
};

/** Personal (just you) or organization (needs an admin): the scopes a user can write to. Inside a `FormItem`. */
export function SkillScopeSelect({ value, onChange, disabled }: SkillScopeSelectProps) {
  const t = useTranslations("skills.scope");
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next === "ORGANIZATION" ? "ORGANIZATION" : "PERSONAL")}
      disabled={disabled}
    >
      <FormControl>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value="PERSONAL">{t("personal")}</SelectItem>
        <SelectItem value="ORGANIZATION">{t("organization")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
