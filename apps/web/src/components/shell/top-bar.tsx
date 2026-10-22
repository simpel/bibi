import { Separator, SidebarTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Breadcrumb } from "./breadcrumb";
import { CommandBar } from "./command-bar";
import type { ShellAccess } from "./shell-types";

export type TopBarProps = { access: ShellAccess };

/** Sidebar toggle and breadcrumb on the left, the ⌘K command bar on the right. */
export function TopBar({ access }: TopBarProps) {
  const t = useTranslations("nav");
  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger label={t("openMenu")} />
      <Separator orientation="vertical" className="h-4" />
      <div className="flex min-w-0 flex-1 items-center">
        <Breadcrumb />
      </div>
      <CommandBar permissions={access.permissions} />
    </header>
  );
}
