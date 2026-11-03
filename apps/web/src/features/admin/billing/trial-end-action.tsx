"use client";

import type { BillingOrganizationDto } from "@bibi/core/schemas";
import { DataTableRowAction } from "@bibi/ui";
import { CalendarClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TrialEndDialog } from "./trial-end-dialog";

export type TrialEndActionProps = { organization: BillingOrganizationDto };

/** Row action: change the trial end. */
export function TrialEndAction({ organization }: TrialEndActionProps) {
  const t = useTranslations("admin.billing.organizations");
  const [open, setOpen] = useState(false);
  return (
    <>
      <DataTableRowAction
        label={t("changeTrial")}
        icon={CalendarClockIcon}
        onClick={() => setOpen(true)}
      />
      {open ? (
        <TrialEndDialog organization={organization} open={open} onOpenChange={setOpen} />
      ) : null}
    </>
  );
}
