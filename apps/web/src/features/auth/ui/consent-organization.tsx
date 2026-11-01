"use client";

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ConsentOrganization } from "../consent-organization-type";

export type ConsentOrganizationProps = {
  organizations: ConsentOrganization[];
  value: string | null;
  onChange: (input: { id: string }) => void;
};

/** Which organization the app gets access to: named when there is one, a select when several. */
export function ConsentOrganizationPicker({
  organizations,
  value,
  onChange,
}: ConsentOrganizationProps) {
  const t = useTranslations("auth");
  if (organizations.length === 0)
    return <p className="text-sm text-destructive">{t("consentNoOrganization")}</p>;
  if (organizations.length === 1) {
    return (
      <p className="text-sm">
        {t("consentOrganization", { organization: organizations[0]?.name ?? "" })}
      </p>
    );
  }
  return (
    <div className="grid gap-2">
      <Label htmlFor="consent-organization">{t("consentPickOrganization")}</Label>
      <Select value={value ?? undefined} onValueChange={(id) => onChange({ id })}>
        <SelectTrigger id="consent-organization" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {organizations.map(({ id, name }) => (
            <SelectItem key={id} value={id}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
