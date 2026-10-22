"use client";

import type { ItemDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { itemRoute } from "@/lib/routes";
import { ItemForm } from "./item-form";
import type { ItemFormData } from "./item-form-data";

export type ItemUpdateFormProps = { item: ItemDto; data: ItemFormData };

/** The item form on its update page; saving (or cancelling) goes back to the item. */
export function ItemUpdateForm({ item, data }: ItemUpdateFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <ItemForm data={data} item={item} onDone={() => router.push(itemRoute({ id: item.id }))} />
    </div>
  );
}
