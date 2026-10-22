import { Checkbox, Label } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useId } from "react";

export type AcknowledgeCheckProps = {
  checked: boolean;
  disabled: boolean;
  onChange: (input: { acknowledged: boolean }) => void;
};

/** "I understand what this affects": required before Confirm when a consequence is a warning. */
export function AcknowledgeCheck({ checked, disabled, onChange }: AcknowledgeCheckProps) {
  const t = useTranslations("assistant.approval.consequences");
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange({ acknowledged: value === true })}
      />
      <Label htmlFor={id}>{t("understand")}</Label>
    </div>
  );
}
