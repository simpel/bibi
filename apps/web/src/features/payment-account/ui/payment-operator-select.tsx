"use client";

import type { PaymentOperator } from "@bibi/core";
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { updatePaymentSettingsAction } from "../actions";

export type OperatorChoice = PaymentOperator | "AUTO";

export type PaymentOperatorOption = { value: OperatorChoice; label: string };

export type PaymentOperatorSelectProps = {
  label: string;
  value: OperatorChoice;
  canEdit: boolean;
  options: PaymentOperatorOption[];
};

const isChoice = ({ value, options }: { value: string; options: PaymentOperatorOption[] }) =>
  options.find((option) => option.value === value)?.value;

/** The payment operator, saved as soon as it changes (`paymentSettings.update`, ADR 0090). */
export function PaymentOperatorSelect({
  label,
  value,
  canEdit,
  options,
}: PaymentOperatorSelectProps) {
  const t = useTranslations("paymentSettings");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const [current, setCurrent] = useState(value);
  const choose = ({ next }: { next: string }) => {
    const choice = isChoice({ value: next, options });
    if (!choice || choice === current) return;
    const previous = current;
    setCurrent(choice);
    run({
      action: () =>
        updatePaymentSettingsAction({
          input: { paymentOperator: choice === "AUTO" ? null : choice },
        }),
      messages: { pending: common("saving"), success: t("saved") },
      onSuccess: () => router.refresh(),
      onError: () => setCurrent(previous),
    });
  };
  return (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="payment-operator-choice">{label}</Label>
      <Select
        value={current}
        onValueChange={(next) => choose({ next })}
        disabled={!canEdit || pending}
      >
        <SelectTrigger id="payment-operator-choice">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
