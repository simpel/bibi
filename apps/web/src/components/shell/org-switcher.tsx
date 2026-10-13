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
  Skeleton,
  toast,
} from "@okazi/ui";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

export type OrgSwitcherProps = { organizationId: string };

/** Active organization + switcher, backed by the Better Auth organization client. */
export function OrgSwitcher({ organizationId }: OrgSwitcherProps) {
  const t = useTranslations("shell");
  const auth = useTranslations("auth");
  const router = useRouter();
  const { data: organizations, isPending } = authClient.useListOrganizations();
  const active = organizations?.find((org) => org.id === organizationId);
  if (isPending) return <Skeleton className="h-9 w-full" />;
  const select = async ({ id, name }: { id: string; name: string }) => {
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
        <DropdownMenuLabel>{t("organization")}</DropdownMenuLabel>
        {(organizations ?? []).map((org) => (
          <DropdownMenuItem key={org.id} onSelect={() => select({ id: org.id, name: org.name })}>
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === organizationId ? <CheckIcon /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(ROUTES.selectOrganization)}>
          <PlusIcon />
          {auth("createOrganization")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
