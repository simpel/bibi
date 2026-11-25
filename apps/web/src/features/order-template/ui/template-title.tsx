"use client";

import { useTranslations } from "next-intl";
import { EditableTitle } from "@/components/states/editable-title";
import { updateOrderTemplateAction } from "../actions";

export type TemplateTitleProps = { id: string; name: string; canEdit: boolean };

/** The template page's heading: rename in place (`orderTemplate:write`). */
export function TemplateTitle({ id, name, canEdit }: TemplateTitleProps) {
  const t = useTranslations("orderTemplate.page");
  return (
    <EditableTitle
      title={name}
      value={name}
      maxLength={200}
      label={t("titleLabel")}
      editLabel={t("editTitle")}
      successMessage={t("titleUpdated")}
      canEdit={canEdit}
      save={({ value }) => updateOrderTemplateAction({ input: { id, name: value } })}
    />
  );
}
