"use client";

import type { RoleCreateInput, RoleDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, DialogFooter, toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { ErrorBanner } from "@/components/states/error-banner";
import { useActionSubmit } from "@/lib/use-action-submit";
import { createRoleAction, updateRoleAction } from "../actions";
import { PermissionMatrix } from "./permission-matrix";
import { useRoleForm } from "./use-role-form";

export type RoleFormProps = { role?: RoleDto | undefined; onDone: () => void };

/** Create (no `role`) or edit form: name plus the permission matrix. */
export function RoleForm({ role, onDone }: RoleFormProps) {
  const t = useTranslations("role");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useRoleForm({ role });
  const { pending, errorKey, run } = useActionSubmit<RoleDto>({
    onSuccess: () => {
      toast.success(t(role ? "updated" : "created"));
      router.refresh();
      onDone();
    },
  });
  const save = ({ values }: { values: RoleCreateInput }) =>
    role
      ? updateRoleAction({ input: { id: role.id, ...values } })
      : createRoleAction({ input: values });
  const onSubmit = form.handleSubmit((values) => run({ action: () => save({ values }) }));
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <ErrorBanner errorKey={errorKey} />
      <TextField form={form} name="name" label={t("fields.name")} required />
      <Controller
        control={form.control}
        name="permissions"
        render={({ field }) => <PermissionMatrix value={field.value} onChange={field.onChange} />}
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
  );
}
