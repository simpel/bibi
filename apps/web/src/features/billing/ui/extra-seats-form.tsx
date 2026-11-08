"use client";

import type { BillingDto } from "@bibi/core";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TextField } from "@/components/form/text-field";
import { useExtraSeatsForm } from "./use-extra-seats-form";

export type ExtraSeatsFormProps = {
  extraSeats: number;
  /** One extra seat a month, in the user's money format. */
  seatPrice: string;
  canEdit: boolean;
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: (input: { value: BillingDto }) => void;
};

/** Paid seats beyond the included ones; never below what members use (core says so). */
export function ExtraSeatsForm({ extraSeats, seatPrice, canEdit, onSaved }: ExtraSeatsFormProps) {
  const t = useTranslations("billing.settings");
  const { form, submit, pending, asking, confirm, cancel } = useExtraSeatsForm({
    extraSeats,
    onSaved,
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-xs gap-3">
        <fieldset disabled={!canEdit} className="grid gap-2">
          <TextField form={form} name="extraSeats" label={t("extraSeats")} type="number" step="1" />
          <p className="text-xs text-muted-foreground">
            {t("extraSeatsHint", { price: seatPrice })}
          </p>
        </fieldset>
        {canEdit ? (
          <div>
            <Button type="submit" variant="outline" disabled={pending}>
              {t("saveSeats")}
            </Button>
          </div>
        ) : null}
      </form>
      <ConfirmDialog
        open={asking !== null}
        onOpenChange={(open) => (open ? null : cancel())}
        title={t("confirmSeatsTitle")}
        description={t("confirmSeatsDescription", {
          count: asking?.extraSeats ?? 0,
          price: seatPrice,
        })}
        confirmLabel={t("saveSeats")}
        variant="default"
        pending={pending}
        onConfirm={confirm}
      />
    </Form>
  );
}
