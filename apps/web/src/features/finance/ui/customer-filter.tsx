"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { financialsHref } from "../lib/finance-href";
import type { Period } from "../lib/finance-period";

const ALL = "all";

export type CustomerFilterProps = {
  period: Period;
  customers: readonly { id: string; name: string }[];
  customerId: string | undefined;
};

/** Narrows the financials to one customer; "All customers" clears it. */
export function CustomerFilter({ period, customers, customerId }: CustomerFilterProps) {
  const t = useTranslations("finance.customerFilter");
  const router = useRouter();
  return (
    <Select
      value={customerId ?? ALL}
      onValueChange={(value) =>
        router.push(financialsHref({ ...period, customerId: value === ALL ? undefined : value }))
      }
    >
      <SelectTrigger aria-label={t("label")} className="h-8 w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{t("all")}</SelectItem>
        {customers.map(({ id, name }) => (
          <SelectItem key={id} value={id}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
