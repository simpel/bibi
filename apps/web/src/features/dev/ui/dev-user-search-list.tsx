import type { DevUser } from "@okazi/auth";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@okazi/ui";
import { useTranslations } from "next-intl";

export type DevUserSearchListProps = {
  users: DevUser[];
  onSelect: (input: { user: DevUser }) => void;
};

/** Every user of an organization behind an inline filter on name, email and role. */
export function DevUserSearchList({ users, onSelect }: DevUserSearchListProps) {
  const t = useTranslations("dev");
  return (
    // The menu's typeahead and arrow-key handling must not swallow the filter input's keys.
    <Command onKeyDown={(event) => event.stopPropagation()}>
      <CommandInput placeholder={t("searchUsers")} />
      <CommandList>
        <CommandEmpty>{t("noUsers")}</CommandEmpty>
        {users.map((user) => (
          <CommandItem
            key={user.id}
            value={`${user.name} ${user.email} ${user.role}`}
            onSelect={() => onSelect({ user })}
          >
            <span className="grid">
              <span className="text-sm">{user.name}</span>
              <span className="text-xs text-muted-foreground">
                {user.role} · {user.email}
              </span>
            </span>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
