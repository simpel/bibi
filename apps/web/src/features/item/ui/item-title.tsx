"use client";

import { useTranslations } from "next-intl";
import { EditableTitle } from "@/components/states/editable-title";
import { updateItemAction } from "../actions";

export type ItemTitleProps = { id: string; name: string; canEdit: boolean };

/** The item page's heading: rename in place (`item:write`). */
export function ItemTitle({ id, name, canEdit }: ItemTitleProps) {
  const t = useTranslations("item.page");
  return (
    <EditableTitle
      title={name}
      value={name}
      maxLength={200}
      label={t("titleLabel")}
      editLabel={t("editTitle")}
      successMessage={t("titleUpdated")}
      canEdit={canEdit}
      save={({ value }) => updateItemAction({ input: { id, name: value } })}
    />
  );
}
