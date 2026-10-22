import type { FixedRole, MemberDto } from "@bibi/core";
import { Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { RoleSelectField } from "./role-select-field";
import { useAssignRoleForm } from "./use-assign-role-form";

export type MemberRoleFormProps = { member: MemberDto; roles: readonly FixedRole[] };

/** The role cell of the member table: a select that saves on pick, one toast per save. */
export function MemberRoleForm({ member, roles }: MemberRoleFormProps) {
  const t = useTranslations("member");
  const { form, submit, pending } = useAssignRoleForm({ member });
  return (
    <Form {...form}>
      <form onSubmit={submit}>
        <RoleSelectField
          control={form.control}
          name="role"
          label={t("roleOf", { name: member.name })}
          placeholder={t("selectRole")}
          roles={roles}
          disabled={false}
          pending={pending}
          onPick={() => void submit()}
        />
      </form>
    </Form>
  );
}
