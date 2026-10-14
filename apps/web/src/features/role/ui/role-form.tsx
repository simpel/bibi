import type { RoleDto } from "@okazi/core";
import {
  Button,
  DialogFooter,
  Form,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PermissionMatrix } from "./permission-matrix";
import { RoleNameField } from "./role-name-field";
import { useRoleForm } from "./use-role-form";

export type RoleFormProps = { role?: RoleDto | undefined; onDone: () => void };

/** Create (no `role`) or edit form: name plus the permission matrix. */
export function RoleForm({ role, onDone }: RoleFormProps) {
  const t = useTranslations("role");
  const common = useTranslations("common");
  const { form, submit, pending } = useRoleForm({ role, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <RoleNameField control={form.control} label={t("fields.name")} />
        <FormController
          control={form.control}
          name="permissions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.permissions")}</FormLabel>
              <PermissionMatrix value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
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
