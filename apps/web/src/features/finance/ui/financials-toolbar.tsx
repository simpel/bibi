import type { PlainDate } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { Period } from "../lib/finance-period";
import { CustomerFilter } from "./customer-filter";

export type FinancialsToolbarProps = {
  period: Period;
  today: PlainDate;
  customers: readonly { id: string; name: string }[];
  customerId: string | undefined;
};

/** The customer filter on the left; the accounting settings on the right. */
export function FinancialsToolbar(props: FinancialsToolbarProps) {
  const { period, customers, customerId } = props;
  const t = useTranslations("finance");
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        {customers.length > 0 ? (
          <CustomerFilter period={period} customers={customers} customerId={customerId} />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.adminAccounting}>{t("accountingSettings")}</Link>
        </Button>
      </div>
    </div>
  );
}
