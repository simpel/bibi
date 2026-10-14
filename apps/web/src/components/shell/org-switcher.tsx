"use client";

import { useRouter } from "@okazi/i18n/navigation";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Skeleton,
  toast,
} from "@okazi/ui";
import { ChevronsUpDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";
import { OrgMenuItems, type OrgOption } from "./org-menu-items";

export type OrgSwitcherProps = { organizationId: string };

/** Active organization + switcher, backed by the Better Auth organization client. */
export function OrgSwitcher({ organizationId }: OrgSwitcherProps) {
  const t = useTranslations("shell");
  const auth = useTranslations("auth");
  const router = useRouter();
  const { data: organizations, isPending } = authClient.useListOrganizations();
  if (isPending) return <Skeleton className="h-9 w-full" />;
  const active = organizations?.find((org) => org.id === organizationId);
  const select = async ({ id, name }: OrgOption) => {
    await authClient.organization.setActive({ organizationId: id });
    toast.success(t("switchedOrganization", { name }));
    router.refresh();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          aria-label={auth("switchOrganization")}
        >
          <span className="truncate">{active?.name ?? t("noOrganization")}</span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <OrgMenuItems
          organizations={organizations ?? []}
          activeId={organizationId}
          onSelect={select}
          onCreate={() => router.push(ROUTES.selectOrganization)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
