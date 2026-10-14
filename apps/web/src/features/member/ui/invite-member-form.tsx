import { Button, DialogFooter, Form, FormController, FormItem, FormMessage } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { RoleChecklist } from "./role-checklist";
import { useInviteMemberForm } from "./use-invite-member-form";

export type InviteMemberFormProps = { roleNames: string[]; onDone: () => void };

/** Email and at least one role, validated by core's `member.invite` schema. */
export function InviteMemberForm({ roleNames, onDone }: InviteMemberFormProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const { form, submit, pending } = useInviteMemberForm({ onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="email" type="email" label={t("columns.email")} required />
        <FormController
          control={form.control}
          name="roles"
          render={({ field }) => (
            <FormItem>
              <RoleChecklist roleNames={roleNames} value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
        {roleNames.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noRoles")}</p>
        ) : null}
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
