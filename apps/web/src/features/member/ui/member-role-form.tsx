"use client";

import type { FixedRole, MemberDto } from "@bibi/core";
import { Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RoleSelectField } from "./role-select-field";
import { useAssignRoleForm } from "./use-assign-role-form";

export type MemberRoleFormProps = { member: MemberDto; roles: readonly FixedRole[] };

/**
 * The role cell of the member table: a select that saves on pick, one toast per save. A lower
 * role removes access, so it asks first.
 */
export function MemberRoleForm({ member, roles }: MemberRoleFormProps) {
  const t = useTranslations("member");
  const roleLabel = useTranslations("role");
  const { form, pending, pick, lowering, confirm, cancel, from } = useAssignRoleForm({ member });
  const to = roleLabel(form.watch("role"));
  return (
    <Form {...form}>
      <form onSubmit={(event) => event.preventDefault()}>
        <RoleSelectField
          control={form.control}
          name="role"
          label={t("roleOf", { name: member.name })}
          placeholder={t("selectRole")}
          roles={roles}
          disabled={false}
          pending={pending}
          onPick={pick}
        />
      </form>
      <ConfirmDialog
        open={lowering}
        onOpenChange={(open) => (open ? undefined : cancel())}
        title={t("lowerRoleTitle", { name: member.name, role: to })}
        description={t("lowerRoleDescription", {
          name: member.name,
          from: roleLabel(from),
          role: to,
        })}
        confirmLabel={t("lowerRoleConfirm")}
        pending={pending}
        onConfirm={confirm}
      />
    </Form>
  );
}
