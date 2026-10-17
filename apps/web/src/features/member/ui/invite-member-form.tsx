import type { FixedRole } from "@okazi/core/schemas";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { RoleField } from "./role-field";
import { useInviteMemberForm } from "./use-invite-member-form";

export type InviteMemberFormProps = { roles: FixedRole[]; onDone: () => void };

/** Email and one fixed role, validated by core's `member.invite` schema. */
export function InviteMemberForm({ roles, onDone }: InviteMemberFormProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const { form, submit, pending } = useInviteMemberForm({ onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="email" type="email" label={t("columns.email")} required />
        <RoleField control={form.control} name="role" roles={roles} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {t("sendInvitation")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
