"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { Popover, PopoverAnchor, PopoverContent, VisualTile } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CornerEditButton } from "@/components/inline-edit/corner-edit-button";
import { InlineEditContext } from "@/components/inline-edit/inline-edit";
import { fileUrl } from "@/lib/file-url";
import type { OrderTemplateFormData } from "./order-template-form-data";
import { TemplateInlineEditor } from "./template-inline-editor";

export type TemplatePictureEditableProps = {
  template: OrderTemplateDto;
  data: OrderTemplateFormData;
  canEdit: boolean;
};

/** The template's picture beside its title; with write access a pencil on it opens the picker. */
export function TemplatePictureEditable({ template, data, canEdit }: TemplatePictureEditableProps) {
  const t = useTranslations("orderTemplate.page");
  const [open, setOpen] = useState(false);
  const src = template.imageKey ? fileUrl({ key: template.imageKey }) : null;
  const tile = <VisualTile size="md" src={src} className="rounded-full" />;
  if (!canEdit) return tile;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <span className="relative inline-flex shrink-0">
          {tile}
          <CornerEditButton aria-label={t("editPicture")} onClick={() => setOpen(true)} />
        </span>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-[min(32rem,calc(100vw-2rem))]">
        <InlineEditContext.Provider value={{ close: () => setOpen(false) }}>
          {open ? <TemplateInlineEditor template={template} data={data} group="picture" /> : null}
        </InlineEditContext.Provider>
      </PopoverContent>
    </Popover>
  );
}
