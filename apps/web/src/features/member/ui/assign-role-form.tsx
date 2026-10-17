import type { FixedRole, MemberDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { RoleField } from "./role-field";
import { useAssignRoleForm } from "./use-assign-role-form";

export type AssignRoleFormProps = { member: MemberDto; roles: FixedRole[]; onDone: () => void };

/** One fixed role, validated by core's `member.assignRole` schema. */
export function AssignRoleForm({ member, roles, onDone }: AssignRoleFormProps) {
  const common = useTranslations("common");
  const { form, submit, pending } = useAssignRoleForm({ member, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <RoleField control={form.control} name="role" roles={roles} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
