"use client";

import { ArchiveRetentionDaysSchema } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminSection } from "@/components/admin/admin-section";
import { TextField } from "@/components/form/text-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { saveOrganizationAction } from "../../welcome/actions";

type RetentionValues = { archiveRetentionDays: string };

const schema = formSchema({
  schema: z.object({ archiveRetentionDays: ArchiveRetentionDaysSchema }),
  toInput: ({ values }: { values: RetentionValues }) => ({
    archiveRetentionDays:
      values.archiveRetentionDays.trim() === "" ? Number.NaN : Number(values.archiveRetentionDays),
  }),
});

export type ArchiveRetentionFormProps = { days: number; canEdit: boolean };

/**
 * How long an archived record is kept before the nightly job deletes it (ADR 0118): 1 to 180
 * days. Money records are never deleted, whatever the number.
 */
export function ArchiveRetentionForm({ days, canEdit }: ArchiveRetentionFormProps) {
  const t = useTranslations("organizationSettings.archiveRetention");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: { archiveRetentionDays: String(days) },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => saveOrganizationAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => router.refresh(),
  });
  return (
    <AdminSection section="archiveRetention" description={t("hint")}>
      <Form {...form}>
        <form onSubmit={submit} noValidate className="grid max-w-md gap-4">
          <fieldset disabled={!canEdit || pending} className="grid gap-4">
            <TextField
              form={form}
              name="archiveRetentionDays"
              label={t("label")}
              type="number"
              step="1"
            />
          </fieldset>
          {canEdit ? (
            <div>
              <Button type="submit" disabled={pending}>
                {common("save")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("readOnly")}</p>
          )}
        </form>
      </Form>
    </AdminSection>
  );
}
