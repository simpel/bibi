import type { MemberDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { AssignRolesForm } from "./assign-roles-form";

export type AssignRolesDialogProps = {
  member: MemberDto;
  /** Names of the roles that can be assigned (owner excluded). */
  roleNames: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Multi-select of existing role names; saving replaces the member's roles. */
export function AssignRolesDialog({
  member,
  roleNames,
  open,
  onOpenChange,
}: AssignRolesDialogProps) {
  const t = useTranslations("member");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assignRoles")}</DialogTitle>
          <DialogDescription>{t("assignDescription", { name: member.name })}</DialogDescription>
        </DialogHeader>
        <AssignRolesForm member={member} roleNames={roleNames} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
