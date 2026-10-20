import type { DevUser } from "@okazi/auth";
import { DropdownMenuSeparator } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { DevUserMenuItem } from "./dev-user-menu-item";

export type DevAdminMenuProps = {
  admins: DevUser[];
  currentUserId: string | null;
  onSelect: (input: { user: DevUser }) => void;
  onResetOnboarding: (input: { user: DevUser }) => void;
};

/** The seeded superadmins as top-level entries, above the organizations. */
export function DevAdminMenu({
  admins,
  currentUserId,
  onSelect,
  onResetOnboarding,
}: DevAdminMenuProps) {
  const t = useTranslations("dev");
  if (admins.length === 0) return null;
  return (
    <>
      {admins.map((user) => (
        <DevUserMenuItem
          key={user.id}
          user={user}
          current={user.id === currentUserId}
          subtitle={t("platformAdmin")}
          onSelect={onSelect}
          onResetOnboarding={onResetOnboarding}
        />
      ))}
      <DropdownMenuSeparator />
    </>
  );
}
