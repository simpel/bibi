import type { DevUser } from "@bibi/auth";
import { CommandItem } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type DevUserSearchRowsProps = {
  user: DevUser;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (input: { user: DevUser }) => void;
  onResetOnboarding: (input: { user: DevUser }) => void;
};

/** One user row; when expanded, their two actions follow right below it. */
export function DevUserSearchRows({
  user,
  expanded,
  onToggle,
  onSelect,
  onResetOnboarding,
}: DevUserSearchRowsProps) {
  const t = useTranslations("dev");
  const value = `${user.name} ${user.email} ${user.role}`;
  const actions = [
    { key: "switch", label: t("switchTo", { name: user.name }), run: onSelect },
    { key: "reset", label: t("resetOnboarding"), run: onResetOnboarding },
  ];
  return (
    <>
      <CommandItem value={value} onSelect={onToggle}>
        <span className="grid">
          <span className="text-sm">{user.name}</span>
          <span className="text-xs text-muted-foreground">
            {user.role} · {user.email}
          </span>
        </span>
      </CommandItem>
      {expanded
        ? actions.map(({ key, label, run }) => (
            <CommandItem
              key={key}
              value={`${value} ${key}`}
              className="pl-8"
              onSelect={() => run({ user })}
            >
              {label}
            </CommandItem>
          ))
        : null}
    </>
  );
}
