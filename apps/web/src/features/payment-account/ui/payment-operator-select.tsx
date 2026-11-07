"use client";

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";

export type PaymentOperatorOption = { value: string; label: string; disabled: boolean };

export type PaymentOperatorSelectProps = {
  label: string;
  placeholder: string;
  /** The connected operator, or undefined while none is connected. */
  selected: string | undefined;
  options: PaymentOperatorOption[];
};

/** The payment operators Bibi supports; the selected one is the one that is connected. */
export function PaymentOperatorSelect({
  label,
  placeholder,
  selected,
  options,
}: PaymentOperatorSelectProps) {
  return (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="payment-operator">{label}</Label>
      <Select {...(selected ? { value: selected } : {})}>
        <SelectTrigger id="payment-operator">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
