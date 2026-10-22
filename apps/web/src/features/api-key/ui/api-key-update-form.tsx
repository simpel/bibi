"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ApiKeyDto, ApiKeyUpdateInput, FixedRole } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updateApiKeyAction } from "../actions";
import { ApiKeySelectField } from "./api-key-select-field";
import { type ApiKeyUpdateValues, apiKeyUpdateSchema } from "./api-key-update-schema";

export type ApiKeyUpdateFormProps = { apiKey: ApiKeyDto; roles: readonly FixedRole[] };

/** Name and preset of an existing key; saving returns to the integrations page. */
export function ApiKeyUpdateForm({ apiKey, roles }: ApiKeyUpdateFormProps) {
  const t = useTranslations("integration.apiKeys");
  const common = useTranslations("common");
  const roleLabel = useTranslations("role");
  const router = useRouter();
  const back = () => router.push(ROUTES.adminApiKeys);
  const form = useForm<ApiKeyUpdateValues, unknown, ApiKeyUpdateInput>({
    resolver: zodResolver(apiKeyUpdateSchema({ id: apiKey.id }), useZodMessages()),
    defaultValues: { name: apiKey.name, role: apiKey.role },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateApiKeyAction({ input: values }),
    messages: { pending: common("saving"), success: t("updated") },
    onSuccess: back,
  });
  const options = roles.map((role) => ({ value: role, label: roleLabel(role) }));
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-2xl gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <ApiKeySelectField
          control={form.control}
          name="role"
          label={t("fields.role")}
          placeholder={t("fields.rolePlaceholder")}
          options={options}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={back}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
