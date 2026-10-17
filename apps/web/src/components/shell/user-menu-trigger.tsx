import { ChevronsUpDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import type { ShellUser } from "./shell-types";
import { useOrgSwitch } from "./use-org-switch";

export type UserMenuTriggerProps = ComponentProps<"button"> & {
  user: ShellUser;
  organizationId: string;
};

/** Avatar, name and active organization; the dropdown trigger passes its props through. */
export function UserMenuTrigger({ user, organizationId, ...props }: UserMenuTriggerProps) {
  const t = useTranslations("shell");
  const { organizations, isPending } = useOrgSwitch();
  const organization = organizations.find((org) => org.id === organizationId)?.name;
  const initials = (user.name || user.email).slice(0, 2).toUpperCase();
  return (
    <button
      type="button"
      aria-label={t("userMenu")}
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent data-[state=open]:bg-accent"
      {...props}
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
      >
        {initials}
      </span>
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-sm font-medium">{user.name || user.email}</span>
        <span className="truncate text-xs text-muted-foreground">
          {organization ?? (isPending ? "" : t("noOrganization"))}
        </span>
      </span>
      <ChevronsUpDownIcon className="size-4 opacity-50" />
    </button>
  );
}
