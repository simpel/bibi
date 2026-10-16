import type { PriceListDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import type { PriceListFormData } from "./load-price-list-form-data";
import { PriceListRowActions } from "./price-list-row-actions";
import { PriceListPricing, PriceListValidity } from "./price-list-terms";

export type PriceListTableProps = {
  priceLists: PriceListDto[];
  data: PriceListFormData;
  canWrite: boolean;
};

/** Price lists with their customer, validity and pricing. */
export async function PriceListTable({ priceLists, data, canWrite }: PriceListTableProps) {
  const t = await getTranslations("priceList");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.customer")}</TableHead>
          <TableHead>{t("columns.validity")}</TableHead>
          <TableHead>{t("columns.pricing")}</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {priceLists.map((priceList) => (
          <TableRow key={priceList.id}>
            <TableCell className="font-medium">{priceList.name}</TableCell>
            <TableCell>
              {priceList.customerId
                ? nameOf({ options: data.customers, id: priceList.customerId })
                : t("noCustomer")}
            </TableCell>
            <TableCell>
              <PriceListValidity {...priceList} />
            </TableCell>
            <TableCell>
              <PriceListPricing {...priceList} itemCount={priceList.items.length} />
            </TableCell>
            <TableCell>
              {canWrite ? <PriceListRowActions priceList={priceList} data={data} /> : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
