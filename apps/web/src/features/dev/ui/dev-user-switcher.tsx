"use client";

import type { DevUser } from "@okazi/auth";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@okazi/ui";
import { DatabaseIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DevService } from "@/lib/dev-services";
import { DevServiceMenu } from "./dev-service-menu";
import { DevUserMenuGroups } from "./dev-user-menu-groups";
import { useDevSwitcherActions } from "./use-dev-switcher-actions";

export type DevUserSwitcherProps = {
  users: DevUser[];
  services: DevService[];
  currentUserId: string | null;
};

/** Development only (rendered by `DevUserSwitcherSlot`): pick a seeded user to sign in as. */
export function DevUserSwitcher({ users, services, currentUserId }: DevUserSwitcherProps) {
  const t = useTranslations("dev");
  const { open, setOpen, pending, switchTo, resetOnboarding, reseed } = useDevSwitcherActions();
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" disabled={pending} aria-label={t("switchUser")}>
            <UsersIcon />
            {t("devUsers")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <DevServiceMenu services={services} />
          <DropdownMenuSeparator />
          <DevUserMenuGroups
            users={users}
            currentUserId={currentUserId}
            onSelect={switchTo}
            onResetOnboarding={resetOnboarding}
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={reseed}>
            <DatabaseIcon />
            {t("reseed")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
