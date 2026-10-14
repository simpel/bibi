"use client";

import type { MemberDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ErrorBanner } from "@/components/states/error-banner";
import { assignMemberRolesAction } from "../actions";
import { useRoleSelection } from "./use-role-selection";

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
  const common = useTranslations("common");
  const _router = useRouter();
  const { selected, toggle, pending, errorKey, run } = useRoleSelection({
    member,
    onDone: () => onOpenChange(false),
  });
  const save = () =>
    run({ action: () => assignMemberRolesAction({ id: member.id, roles: selected }) });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assignRoles")}</DialogTitle>
          <DialogDescription>{t("assignDescription", { name: member.name })}</DialogDescription>
        </DialogHeader>
        <ErrorBanner errorKey={errorKey} />
        <RoleChecklist roleNames={roleNames} selected={selected} onToggle={toggle} />
        {roleNames.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noRoles")}</p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {common("cancel")}
          </Button>
          <Button disabled={pending || selected.length === 0} onClick={save}>
            {common("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type RoleChecklistProps = {
  roleNames: string[];
  selected: string[];
  onToggle: (input: { name: string; checked: boolean }) => void;
};

function RoleChecklist({ roleNames, selected, onToggle }: RoleChecklistProps) {
  return (
    <ul className="grid gap-2">
      {roleNames.map((name) => (
        <li key={name} className="flex items-center gap-2">
          <Checkbox
            id={`role-${name}`}
            checked={selected.includes(name)}
            onCheckedChange={(checked) => onToggle({ name, checked: checked === true })}
          />
          <Label htmlFor={`role-${name}`}>{name}</Label>
        </li>
      ))}
    </ul>
  );
}
