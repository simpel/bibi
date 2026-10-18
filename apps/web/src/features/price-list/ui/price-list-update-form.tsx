"use client";

import type { PriceListDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import type { PriceListFormData } from "./load-price-list-form-data";
import { PriceListForm } from "./price-list-form";

export type PriceListUpdateFormProps = { priceList: PriceListDto; data: PriceListFormData };

/** The form on its update page; saving (or cancelling) goes back to the list. */
export function PriceListUpdateForm({ priceList, data }: PriceListUpdateFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <PriceListForm
        priceList={priceList}
        data={data}
        onDone={() => router.push(ROUTES.settingsPriceLists)}
      />
    </div>
  );
}
