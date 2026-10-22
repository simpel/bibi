import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@bibi/ui";
import { Building2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { OrgMenuItems } from "./org-menu-items";
import { useOrgSwitch } from "./use-org-switch";

export type OrgMenuProps = { organizationId: string };

/** User-menu submenu: switch to another organization or create one. */
export function OrgMenu({ organizationId }: OrgMenuProps) {
  const auth = useTranslations("auth");
  const { organizations, select, create } = useOrgSwitch();
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Building2Icon />
        {auth("switchOrganization")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-56">
        <OrgMenuItems
          organizations={organizations}
          activeId={organizationId}
          onSelect={(org) => void select(org)}
          onCreate={create}
        />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
