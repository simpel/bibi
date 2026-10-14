"use client";

import { useRouter } from "@okazi/i18n/navigation";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@okazi/ui";
import { LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";
import { AdminMenuItem } from "./admin-menu-item";

export type UserMenuProps = { name: string; email: string; platformAdmin: boolean };

export function UserMenu({ name, email, platformAdmin }: UserMenuProps) {
  const t = useTranslations("shell");
  const auth = useTranslations("auth");
  const router = useRouter();
  const initials = (name || email).slice(0, 2).toUpperCase();
  const signOut = async () => {
    await authClient.signOut();
    router.replace(ROUTES.login);
    router.refresh();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full" aria-label={t("userMenu")}>
          <span aria-hidden="true" className="text-xs font-semibold">
            {initials}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="grid gap-0.5 font-normal">
          <span className="text-xs text-muted-foreground">{t("signedInAs")}</span>
          <span className="truncate text-sm font-medium">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {platformAdmin ? <AdminMenuItem /> : null}
        <DropdownMenuItem onSelect={signOut}>
          <LogOutIcon />
          {auth("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
