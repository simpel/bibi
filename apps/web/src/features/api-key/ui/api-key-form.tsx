import type { ApiKeyCreated, GrantableRole } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { API_KEY_EXPIRY_CHOICES } from "./api-key-form-schema";
import { ApiKeySelectField } from "./api-key-select-field";
import { useApiKeyForm } from "./use-api-key-form";

export type ApiKeyFormProps = {
  /** Fixed roles up to the caller's own (never owner). */
  roles: readonly GrantableRole[];
  onCreated: (input: { created: ApiKeyCreated }) => void;
  onCancel: () => void;
};

/** Name, fixed role (never owner, never above the caller's) and expiry of a new key. */
export function ApiKeyForm({ roles, onCreated, onCancel }: ApiKeyFormProps) {
  const t = useTranslations("integration.apiKeys");
  const common = useTranslations("common");
  const roleLabel = useTranslations("role");
  const { form, submit, pending } = useApiKeyForm({ onCreated });
  const roleOptions = roles.map((role) => ({ value: role, label: roleLabel(role) }));
  const expiries = API_KEY_EXPIRY_CHOICES.map((value) => ({ value, label: t(`expiry.${value}`) }));
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <ApiKeySelectField
          control={form.control}
          name="role"
          label={t("fields.role")}
          placeholder={t("fields.rolePlaceholder")}
          options={roleOptions}
        />
        <ApiKeySelectField
          control={form.control}
          name="expires"
          label={t("fields.expires")}
          options={expiries}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("create")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
