import type { DevUser } from "@okazi/auth";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@okazi/ui";
import { UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { groupDevUsers } from "@/lib/group-dev-users";
import { DevUserSearchList } from "./dev-user-search-list";

export type DevUserMenuGroupsProps = {
  users: DevUser[];
  currentUserId: string | null;
  onSelect: (input: { user: DevUser }) => void;
};

/** One sub-menu per organization: one user per role, then a searchable list of everyone. */
export function DevUserMenuGroups({ users, currentUserId, onSelect }: DevUserMenuGroupsProps) {
  const t = useTranslations("dev");
  return groupDevUsers({ users }).map(({ organization, representatives, users: members }) => (
    <DropdownMenuSub key={organization}>
      <DropdownMenuSubTrigger>
        <UsersIcon />
        {organization}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-72">
        {representatives.map((user) => (
          <DropdownMenuCheckboxItem
            key={user.id}
            checked={user.id === currentUserId}
            onSelect={() => onSelect({ user })}
          >
            <span className="grid">
              <span className="text-sm">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.role}</span>
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {t("allUsers", { count: members.length })}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-80">
            <DevUserSearchList users={members} onSelect={onSelect} />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  ));
}
