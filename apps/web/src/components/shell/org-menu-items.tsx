"use client";

import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@bibi/ui";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type OrgOption = { id: string; name: string; slug: string };

export type OrgMenuItemsProps = {
  organizations: readonly OrgOption[];
  activeId: string;
  onSelect: (organization: OrgOption) => void;
  onCreate: () => void;
};

export function OrgMenuItems({ organizations, activeId, onSelect, onCreate }: OrgMenuItemsProps) {
  const t = useTranslations("shell");
  const auth = useTranslations("auth");
  return (
    <>
      <DropdownMenuLabel>{t("organization")}</DropdownMenuLabel>
      {organizations.map((org) => (
        <DropdownMenuItem key={org.id} onSelect={() => onSelect(org)}>
          <span className="flex-1 truncate">{org.name}</span>
          {org.id === activeId ? <CheckIcon /> : null}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onCreate}>
        <PlusIcon />
        {auth("createOrganization")}
      </DropdownMenuItem>
    </>
  );
}
