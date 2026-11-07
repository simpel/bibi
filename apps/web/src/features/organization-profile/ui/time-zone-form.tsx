"use client";

import { OrganizationProfileUpdateInputSchema } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AdminSection } from "@/components/admin/admin-section";
import { TimeZoneField } from "@/components/form/time-zone-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { saveOrganizationAction } from "../../welcome/actions";

const TimeZoneFormSchema = OrganizationProfileUpdateInputSchema.pick({ timeZone: true }).required();

type TimeZoneFormValues = { timeZone: string };

export type TimeZoneFormProps = { timeZone: string; canEdit: boolean };

/**
 * The organization's zone (ADR 0064): order-level times and every venue without its own zone.
 * Changing it changes how times show and are entered; no stored time moves.
 */
export function TimeZoneForm({ timeZone, canEdit }: TimeZoneFormProps) {
  const t = useTranslations("organizationSettings");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<TimeZoneFormValues, unknown, z.output<typeof TimeZoneFormSchema>>({
    resolver: zodResolver(TimeZoneFormSchema, useZodMessages()),
    defaultValues: { timeZone },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => saveOrganizationAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => router.refresh(),
  });
  return (
    <AdminSection title={t("timeZone")} description={t("timeZoneHint")}>
      <Form {...form}>
        <form onSubmit={submit} noValidate className="grid max-w-md gap-4">
          <fieldset disabled={!canEdit} className="grid gap-4">
            <TimeZoneField control={form.control} name="timeZone" label={t("timeZone")} />
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
