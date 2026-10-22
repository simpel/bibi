"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { BookOpenIcon, LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { Link, useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { LocaleMenu } from "./locale-menu";
import { OrgMenu } from "./org-menu";
import { ProfileMenuItem } from "./profile-menu-item";
import type { ShellUser } from "./shell-types";
import { ThemeMenu } from "./theme-menu";
import { UserMenuTrigger } from "./user-menu-trigger";

export type UserMenuProps = { user: ShellUser; organizationId: string };

/** Bottom-left account menu: profile, organization, theme, language, my skills, sign out (ADR 0036). */
export function UserMenu({ user, organizationId }: UserMenuProps) {
  const t = useTranslations("shell");
  const auth = useTranslations("auth");
  const router = useRouter();
  const signOut = async () => {
    await authClient.signOut();
    router.replace(ROUTES.login);
    router.refresh();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <UserMenuTrigger user={user} organizationId={organizationId} />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel className="grid gap-0.5 font-normal">
          <span className="text-xs text-muted-foreground">{t("signedInAs")}</span>
          <span className="truncate text-sm font-medium">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ProfileMenuItem />
        <OrgMenu organizationId={organizationId} />
        <ThemeMenu />
        <LocaleMenu />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.skills}>
            <BookOpenIcon />
            {t("mySkills")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOutIcon />
          {auth("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
