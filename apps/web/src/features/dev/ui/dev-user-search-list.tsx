import type { DevUser } from "@okazi/auth";
import { Command, CommandEmpty, CommandInput, CommandList } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DevUserSearchRows } from "./dev-user-search-rows";

export type DevUserSearchListProps = {
  users: DevUser[];
  onSelect: (input: { user: DevUser }) => void;
  onResetOnboarding: (input: { user: DevUser }) => void;
};

/**
 * Every user of an organization behind an inline filter on name, email and role. Choosing a user
 * opens their two actions right below: switch to them, or reset their onboarding.
 */
export function DevUserSearchList({ users, onSelect, onResetOnboarding }: DevUserSearchListProps) {
  const t = useTranslations("dev");
  const [open, setOpen] = useState<string | null>(null);
  return (
    // The menu's typeahead and arrow-key handling must not swallow the filter input's keys.
    <Command onKeyDown={(event) => event.stopPropagation()}>
      <CommandInput placeholder={t("searchUsers")} />
      <CommandList>
        <CommandEmpty>{t("noUsers")}</CommandEmpty>
        {users.map((user) => (
          <DevUserSearchRows
            key={user.id}
            user={user}
            expanded={open === user.id}
            onToggle={() => setOpen(open === user.id ? null : user.id)}
            onSelect={onSelect}
            onResetOnboarding={onResetOnboarding}
          />
        ))}
      </CommandList>
    </Command>
  );
}
