import { getOrderBalance } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { FactList } from "@/components/typed-fields/fact-list";
import { Link } from "@/lib/navigation";
import { getNumberFormat } from "@/server/number-format";
import { runOperation } from "@/server/run-operation";

export type OrderBalanceFactsProps = {
  orderId: string;
  /** The Money tab, where the payments and requests are. */
  moneyHref: string;
};

/**
 * The order's balance in short for the side panel (ADR 0057): billed, paid and left to pay, with
 * a link to the Money tab. Nothing without `payment:read`, or before anything is billed.
 */
export async function OrderBalanceFacts({ orderId, moneyHref }: OrderBalanceFactsProps) {
  const [t, numbers, result] = await Promise.all([
    getTranslations("payment.balance"),
    getNumberFormat(),
    runOperation({ operation: getOrderBalance, input: { orderId } }),
  ]);
  if (!result.ok) return null;
  const balance = result.value;
  if (balance.billedFrom === "NONE" && balance.paidMinor === 0) return null;
  const money = ({ minor }: { minor: number }) =>
    numbers.money({ minor, currency: balance.currency });
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">{t("title")}</h2>
        <Link
          href={moneyHref}
          scroll={false}
          className="text-sm underline-offset-4 hover:underline"
        >
          {t("open")}
        </Link>
      </div>
      <FactList
        facts={[
          { label: t("billed"), value: money({ minor: balance.billedMinor }) },
          { label: t("paid"), value: money({ minor: balance.paidMinor }) },
          { label: t("balance"), value: money({ minor: balance.balanceMinor }) },
        ]}
      />
    </section>
  );
}
