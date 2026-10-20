"use client";

import type { FixedRole } from "@okazi/core/schemas";
import { Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RoleSelectField } from "@/features/member/ui/role-select-field";
import { type UsePresetFormInput, usePresetForm } from "./use-preset-form";

export type PresetFormProps = UsePresetFormInput & {
  name: string;
  /** The presets the caller may give (`assignableRoles`). */
  roles: readonly FixedRole[];
  disabled: boolean;
};

/** The preset as a select; changing it confirms first, since every permission is replaced. */
export function PresetForm({ name, roles, disabled, ...input }: PresetFormProps) {
  const t = useTranslations("permissions");
  const { form, picked, pending, confirming, pick, confirm, cancel } = usePresetForm(input);
  return (
    <Form {...form}>
      <form className="flex justify-end" onSubmit={(event) => event.preventDefault()}>
        <RoleSelectField
          control={form.control}
          name="role"
          label={t("preset")}
          placeholder={t("presetPlaceholder")}
          roles={roles}
          disabled={disabled}
          pending={pending}
          onPick={pick}
        />
      </form>
      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => (open ? undefined : cancel())}
        title={t("changePresetTitle", { preset: picked })}
        description={t("changePresetDescription", { name, preset: picked })}
        confirmLabel={t("changePresetConfirm")}
        pending={pending}
        onConfirm={confirm}
      />
    </Form>
  );
}
