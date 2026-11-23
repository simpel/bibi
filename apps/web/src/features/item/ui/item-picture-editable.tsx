"use client";

import type { ItemDto } from "@bibi/core";
import { Popover, PopoverAnchor, PopoverContent, VisualTile } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CornerEditButton } from "@/components/inline-edit/corner-edit-button";
import { InlineEditContext } from "@/components/inline-edit/inline-edit";
import { fileUrl } from "@/lib/file-url";
import type { ItemFormData } from "./item-form-data";
import { ItemInlineEditor } from "./item-inline-editor";

export type ItemPictureEditableProps = {
  item: ItemDto;
  data: ItemFormData;
  canEdit: boolean;
};

/** The item's picture beside its title; with `item:write` a pencil on it opens the picker. */
export function ItemPictureEditable({ item, data, canEdit }: ItemPictureEditableProps) {
  const t = useTranslations("item.page");
  const [open, setOpen] = useState(false);
  const src = item.imageKey ? fileUrl({ key: item.imageKey }) : null;
  const tile = <VisualTile size="md" src={src} icon={item.icon} className="rounded-full" />;
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
          {open ? <ItemInlineEditor item={item} data={data} group="picture" /> : null}
        </InlineEditContext.Provider>
      </PopoverContent>
    </Popover>
  );
}
