import type { DevUser } from "@bibi/auth";
import {
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@bibi/ui";
import { UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { groupDevUsers } from "@/lib/group-dev-users";
import { DevUserMenuItem } from "./dev-user-menu-item";
import { DevUserSearchList } from "./dev-user-search-list";

export type DevUserMenuGroupsProps = {
  users: DevUser[];
  currentUserId: string | null;
  onSelect: (input: { user: DevUser }) => void;
  onResetOnboarding: (input: { user: DevUser }) => void;
};

/** One sub-menu per organization: one user per role, then a searchable list of everyone. */
export function DevUserMenuGroups({
  users,
  currentUserId,
  onSelect,
  onResetOnboarding,
}: DevUserMenuGroupsProps) {
  const t = useTranslations("dev");
  return groupDevUsers({ users }).map(({ organization, representatives, users: members }) => (
    <DropdownMenuSub key={organization}>
      <DropdownMenuSubTrigger>
        <UsersIcon />
        {organization}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-72">
        {representatives.map((user) => (
          <DevUserMenuItem
            key={user.id}
            user={user}
            current={user.id === currentUserId}
            onSelect={onSelect}
            onResetOnboarding={onResetOnboarding}
          />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {t("allUsers", { count: members.length })}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-80">
            <DevUserSearchList
              users={members}
              onSelect={onSelect}
              onResetOnboarding={onResetOnboarding}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  ));
}
