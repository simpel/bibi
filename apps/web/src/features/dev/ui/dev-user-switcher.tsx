"use client";

import type { DevUser } from "@bibi/auth";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { BellRingIcon, DatabaseIcon, InboxIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DevService } from "@/lib/dev-services";
import { DevAdminMenu } from "./dev-admin-menu";
import { DevServiceMenu } from "./dev-service-menu";
import { DevUserMenuGroups } from "./dev-user-menu-groups";
import { useDevSend } from "./use-dev-send";
import { useDevSwitcherActions } from "./use-dev-switcher-actions";

export type DevUserSwitcherProps = {
  users: DevUser[];
  /** Seeded superadmins, shown above the organizations. */
  admins: DevUser[];
  services: DevService[];
  currentUserId: string | null;
};

type DevToolItemsProps = { signedIn: boolean; reseed: () => void };

/** The tools at the bottom: a test notification and inbox message, and a reseed. */
function DevToolItems({ signedIn, reseed }: DevToolItemsProps) {
  const t = useTranslations("dev");
  const send = useDevSend();
  return (
    <>
      {signedIn ? (
        <>
          <DropdownMenuItem onSelect={send.notification}>
            <BellRingIcon />
            {t("sendNotification")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={send.inboxMessage}>
            <InboxIcon />
            {t("sendInboxMessage")}
          </DropdownMenuItem>
        </>
      ) : null}
      <DropdownMenuItem onSelect={reseed}>
        <DatabaseIcon />
        {t("reseed")}
      </DropdownMenuItem>
    </>
  );
}

/** Development only (rendered by `DevUserSwitcherSlot`): pick a seeded user to sign in as. */
export function DevUserSwitcher({ users, admins, services, currentUserId }: DevUserSwitcherProps) {
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
          <DevAdminMenu
            admins={admins}
            currentUserId={currentUserId}
            onSelect={switchTo}
            onResetOnboarding={resetOnboarding}
          />
          <DevUserMenuGroups
            users={users}
            currentUserId={currentUserId}
            onSelect={switchTo}
            onResetOnboarding={resetOnboarding}
          />
          <DropdownMenuSeparator />
          <DevToolItems signedIn={currentUserId !== null} reseed={reseed} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
