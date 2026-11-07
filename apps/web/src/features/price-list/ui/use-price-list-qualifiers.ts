import type { PriceListDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { nameOf } from "@/components/form/named-option";
import type { PriceListFormData } from "./load-price-list-form-data";

export type PriceListQualifiersInput = { priceLists: PriceListDto[]; data: PriceListFormData };

type CustomerNameInput = {
  list: PriceListDto;
  data: PriceListFormData;
  none: string;
  hidden: string;
};

/** The customer a list is for ("general" without one); hidden when the caller may not see customers. */
export function priceListCustomerName({ list, data, none, hidden }: CustomerNameInput): string {
  if (!list.customerId) return none;
  return nameOf({
    options: data.customers,
    id: list.customerId,
    hidden: data.customersHidden ? hidden : undefined,
  });
}

/** `customer:` (a name or general) and `pricing:` (discount or item prices). */
export function usePriceListQualifiers({
  priceLists,
  data,
}: PriceListQualifiersInput): TableQualifier<PriceListDto>[] {
  const t = useTranslations("priceList");
  const common = useTranslations("common");
  return useMemo(() => {
    const none = t("noCustomer");
    const hidden = common("hidden");
    const kinds = [t("pricing.kindDiscount"), t("pricing.kindItems")];
    const names = priceLists.map((list) => priceListCustomerName({ list, data, none, hidden }));
    return [
      {
        key: "customer",
        label: t("columns.customer"),
        hint: t("columns.customer"),
        pick: (list) => priceListCustomerName({ list, data, none, hidden }),
        options: Array.from(new Set(names)),
      },
      {
        key: "pricing",
        label: t("columns.pricing"),
        hint: kinds.join(", "),
        pick: (list) => (list.discountPercent === null ? kinds[1] : kinds[0]),
        options: kinds,
      },
    ];
  }, [t, common, priceLists, data]);
}
