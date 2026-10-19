import type { DevUser } from "@okazi/auth";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@okazi/ui";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type DevUserMenuItemProps = {
  user: DevUser;
  current: boolean;
  onSelect: (input: { user: DevUser }) => void;
  onResetOnboarding: (input: { user: DevUser }) => void;
};

/** One user as a sub-menu: switch to them, or send them through the onboarding again. */
export function DevUserMenuItem({
  user,
  current,
  onSelect,
  onResetOnboarding,
}: DevUserMenuItemProps) {
  const t = useTranslations("dev");
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <span className="grid flex-1">
          <span className="text-sm">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.role}</span>
        </span>
        {current ? <CheckIcon aria-label={t("currentUser")} /> : null}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onSelect={() => onSelect({ user })}>
          {t("switchTo", { name: user.name })}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onResetOnboarding({ user })}>
          {t("resetOnboarding")}
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
