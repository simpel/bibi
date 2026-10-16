import type { DevUser } from "@okazi/auth";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@okazi/ui";
import { UsersIcon } from "lucide-react";
import { groupDevUsers } from "@/lib/group-dev-users";

export type DevUserMenuGroupsProps = {
  users: DevUser[];
  currentUserId: string | null;
  onSelect: (input: { user: DevUser }) => void;
};

/** One sub-menu per organization, each listing its seeded users. */
export function DevUserMenuGroups({ users, currentUserId, onSelect }: DevUserMenuGroupsProps) {
  return groupDevUsers({ users }).map(({ organization, users: members }) => (
    <DropdownMenuSub key={organization}>
      <DropdownMenuSubTrigger>
        <UsersIcon />
        {organization}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-72">
        {members.map((user) => (
          <DropdownMenuCheckboxItem
            key={user.id}
            checked={user.id === currentUserId}
            onSelect={() => onSelect({ user })}
          >
            <span className="grid">
              <span className="text-sm">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  ));
}
