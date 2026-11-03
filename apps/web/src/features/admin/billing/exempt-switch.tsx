"use client";

import type { BillingOrganizationDto } from "@bibi/core/schemas";
import { Switch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { updateBillingOrganizationAction } from "./actions";

export type ExemptSwitchProps = { organization: BillingOrganizationDto };

/** An exempt organization is never asked to pay (pilots, Bibi's own). Saves on change. */
export function ExemptSwitch({ organization }: ExemptSwitchProps) {
  const t = useTranslations("admin.billing.organizations");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const { organizationId, name } = organization;
  const change = ({ exempt }: { exempt: boolean }) =>
    run({
      action: () => updateBillingOrganizationAction({ input: { organizationId, exempt } }),
      messages: {
        pending: common("saving"),
        success: exempt ? t("exemptOn", { name }) : t("exemptOff", { name }),
      },
      onSuccess: () => router.refresh(),
    });
  return (
    <Switch
      aria-label={t("columns.exempt")}
      checked={organization.exempt}
      disabled={pending}
      onCheckedChange={(checked) => change({ exempt: checked })}
    />
  );
}
