import type { MemberDto } from "@okazi/core";
import { Button, DialogFooter, Form, FormController, FormItem, FormMessage } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { RoleChecklist } from "./role-checklist";
import { useAssignRolesForm } from "./use-assign-roles-form";

export type AssignRolesFormProps = { member: MemberDto; roleNames: string[]; onDone: () => void };

/** The checklist as a form field, validated by core's schema (at least one role). */
export function AssignRolesForm({ member, roleNames, onDone }: AssignRolesFormProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const { form, submit, pending } = useAssignRolesForm({ member, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
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
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
