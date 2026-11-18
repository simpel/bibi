"use client";

import { useTranslations } from "next-intl";
import { EditableTitle } from "@/components/states/editable-title";
import { updateOrderAction } from "../actions";

export type OrderTitleProps = {
  id: string;
  /** Null for an untitled order: the heading shows `fallback` and the input starts empty. */
  title: string | null;
  fallback: string;
  suffix?: string;
  canEdit: boolean;
};

/** The order page's heading: rename in place (`order:write`). */
export function OrderTitle({ id, title, fallback, suffix, canEdit }: OrderTitleProps) {
  const t = useTranslations("order");
  return (
    <EditableTitle
      title={title ?? fallback}
      value={title ?? ""}
      suffix={suffix}
      maxLength={120}
      label={t("titleLabel")}
      editLabel={t("editTitle")}
      successMessage={t("titleUpdated")}
      canEdit={canEdit}
      save={({ value }) => updateOrderAction({ input: { id, title: value } })}
    />
  );
}
