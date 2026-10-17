"use client";

import type { DevUser } from "@okazi/auth";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@okazi/ui";
import { UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { DevService } from "@/lib/dev-services";
import { useToastAction } from "@/lib/use-toast-action";
import { switchDevUserAction } from "../actions";
import { DevServiceMenu } from "./dev-service-menu";
import { DevUserMenuGroups } from "./dev-user-menu-groups";

export type DevUserSwitcherProps = {
  users: DevUser[];
  services: DevService[];
  currentUserId: string | null;
};

/** Development only (rendered by `DevUserSwitcherSlot`): pick a seeded user to sign in as. */
export function DevUserSwitcher({ users, services, currentUserId }: DevUserSwitcherProps) {
  const t = useTranslations("dev");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const switchTo = ({ user }: { user: DevUser }) =>
    run({
      action: () => switchDevUserAction({ userId: user.id }),
      messages: { pending: t("switching"), success: t("switched", { name: user.name }) },
      onSuccess: () => router.refresh(),
    });
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" disabled={pending} aria-label={t("switchUser")}>
            <UsersIcon />
            {t("devUsers")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <DevServiceMenu services={services} />
          <DropdownMenuSeparator />
          <DevUserMenuGroups users={users} currentUserId={currentUserId} onSelect={switchTo} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
