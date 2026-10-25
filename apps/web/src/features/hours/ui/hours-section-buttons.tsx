"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type HoursSectionButtonsProps = {
  editing: boolean;
  pending: boolean;
  onEdit: () => void;
  onCancel: () => void;
};

/** Change while reading; Save and Cancel while editing. */
export function HoursSectionButtons({
  editing,
  pending,
  onEdit,
  onCancel,
}: HoursSectionButtonsProps) {
  const t = useTranslations("hours");
  if (!editing) {
    return (
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onEdit}>
          {t("change")}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <Button type="submit" disabled={pending}>
        {t("save")}
      </Button>
      <Button type="button" variant="ghost" onClick={onCancel}>
        {t("cancel")}
      </Button>
    </div>
  );
}
