"use client";

import type { BillingOrganizationDto } from "@bibi/core/schemas";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { DateField } from "@/components/date-picker/date-field";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { updateBillingOrganizationAction } from "./actions";
import { useTrialEndForm } from "./use-trial-end-form";

export type TrialEndDialogProps = {
  organization: BillingOrganizationDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ResetTrialInput = { organization: BillingOrganizationDto; onDone: () => void };

/** "Back to 14 days": clears the trial end so it inherits creation + 14 days again. */
function useResetTrial({ organization, onDone }: ResetTrialInput) {
  const t = useTranslations("admin.billing.organizations");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const { organizationId } = organization;
  const reset = () =>
    run({
      action: () =>
        updateBillingOrganizationAction({ input: { organizationId, trialEndsAt: null } }),
      messages: { pending: common("saving"), success: t("trialSaved") },
      onSuccess: () => {
        onDone();
        router.refresh();
      },
    });
  return { run: reset, pending };
}

/** Moves one organization's trial end, or sends it back to 14 days from creation (null). */
export function TrialEndDialog({ organization, open, onOpenChange }: TrialEndDialogProps) {
  const t = useTranslations("admin.billing.organizations");
  const close = () => onOpenChange(false);
  const { form, submit, pending } = useTrialEndForm({ organization, onSaved: close });
  const reset = useResetTrial({ organization, onDone: close });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("trialTitle", { name: organization.name })}</DialogTitle>
          <DialogDescription>{t("trialDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} noValidate className="grid gap-4">
            <DateField form={form} name="trialEndsAt" label={t("trialEnd")} required />
            <DialogFooter>
              <Button type="button" variant="outline" disabled={reset.pending} onClick={reset.run}>
                {t("resetTrial")}
              </Button>
              <Button type="submit" disabled={pending}>
                {t("saveTrial")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
