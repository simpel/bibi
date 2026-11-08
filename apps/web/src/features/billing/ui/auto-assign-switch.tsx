"use client";

import type { BillingDto } from "@bibi/core";
import { Label, Switch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { updateBillingAction } from "../actions";

export type AutoAssignSwitchProps = {
  enabled: boolean;
  canEdit: boolean;
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: (input: { value: BillingDto }) => void;
};

/** On: an invitation beyond the seats adds a paid seat. Off: it waits for approval (ADR 0095 §6). */
export function AutoAssignSwitch({ enabled, canEdit, onSaved }: AutoAssignSwitchProps) {
  const t = useTranslations("billing.settings");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const change = ({ checked }: { checked: boolean }) =>
    run({
      action: () => updateBillingAction({ input: { autoAssignSeats: checked } }),
      messages: {
        pending: common("saving"),
        success: checked ? t("autoAssignOn") : t("autoAssignOff"),
      },
      onSuccess: ({ value }) => (onSaved ? onSaved({ value }) : router.refresh()),
    });
  return (
    <section className="grid gap-2">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="auto-assign-seats">{t("autoAssign")}</Label>
        <Switch
          id="auto-assign-seats"
          checked={enabled}
          disabled={!canEdit || pending}
          onCheckedChange={(checked) => change({ checked })}
        />
      </div>
      <p className="text-sm text-muted-foreground">{t("autoAssignHint")}</p>
    </section>
  );
}
