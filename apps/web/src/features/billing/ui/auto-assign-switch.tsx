"use client";

import type { BillingDto } from "@bibi/core";
import { Label, Switch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { updateBillingAction } from "../actions";

export type AutoAssignSwitchProps = {
  enabled: boolean;
  canEdit: boolean;
  /** One extra seat a month, in the user's money format. */
  seatPrice: string;
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: (input: { value: BillingDto }) => void;
};

/**
 * On: an invitation beyond the seats adds a paid seat. Off: it waits for approval (ADR 0095 §6).
 * Turning it on can cost money, so it asks first; turning it off saves at once.
 */
export function AutoAssignSwitch({ enabled, canEdit, seatPrice, onSaved }: AutoAssignSwitchProps) {
  const t = useTranslations("billing.settings");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const [asking, setAsking] = useState(false);
  const save = ({ checked }: { checked: boolean }) =>
    run({
      action: () => updateBillingAction({ input: { autoAssignSeats: checked } }),
      messages: {
        pending: common("saving"),
        success: checked ? t("autoAssignOn") : t("autoAssignOff"),
      },
      onSuccess: ({ value }) => {
        setAsking(false);
        if (onSaved) onSaved({ value });
        else router.refresh();
      },
    });
  return (
    <section className="grid gap-2">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="auto-assign-seats">{t("autoAssign")}</Label>
        <Switch
          id="auto-assign-seats"
          checked={enabled}
          disabled={!canEdit || pending}
          onCheckedChange={(checked) => (checked ? setAsking(true) : save({ checked }))}
        />
      </div>
      <p className="text-sm text-muted-foreground">{t("autoAssignHint")}</p>
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title={t("confirmAutoAssignTitle")}
        description={t("confirmAutoAssignDescription", { price: seatPrice })}
        confirmLabel={t("confirmAutoAssign")}
        variant="default"
        pending={pending}
        onConfirm={() => save({ checked: true })}
      />
    </section>
  );
}
