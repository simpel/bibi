"use client";

import { OrderView, type OrderViewFact } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { desiredPeriod } from "@/features/order/ui/desired-period";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { orderName } from "@/lib/order-label";
import { orderRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type OrderViewViewProps = GenerativeProps<"order-view">;
type Order = OrderViewViewProps["order"];
type Money = ReturnType<typeof useNumberFormat>;
type Translate = ReturnType<typeof useTranslations<"assistant.ui.order.view">>;

const contactLine = ({ contact }: { contact: Order["contact"] }) =>
  contact ? [contact.name, contact.email ?? contact.phone].filter(Boolean).join(", ") : null;

/** Lines, total and issues (program) and the open balance (payment); null without access. */
function moneyFacts({ order, t, numbers }: { order: Order; t: Translate; numbers: Money }) {
  const { program, balance } = order;
  const total = program ? numbers.money({ minor: program.totalExclVatMinor }) : null;
  const facts: OrderViewFact[] = [
    { key: "lines", label: t("lines"), value: program ? String(program.lineCount) : null },
    {
      key: "total",
      label: t("total"),
      value: total && program?.totalIsFrom ? t("totalFrom", { amount: total }) : total,
    },
    {
      key: "balance",
      label: t("balance"),
      value: balance ? numbers.money({ minor: balance.balanceMinor }) : null,
      tone: balance && balance.balanceMinor > 0 ? "warning" : "default",
    },
    {
      key: "issues",
      label: t("issues"),
      value: program ? String(program.issueCount) : null,
      tone: program && program.issueCount > 0 ? "warning" : "default",
    },
  ];
  return facts;
}

/** One order at a glance (`order.view`, ADR 0097): each fact "–" without its feature's read. */
export function OrderViewView({ order }: OrderViewViewProps) {
  const t = useTranslations("assistant.ui.order.view");
  const tOrder = useTranslations("assistant.ui.order");
  const format = useDateTimeFormat();
  const numbers = useNumberFormat();
  const href = orderRoute({ id: order.id });
  const name = orderName({
    title: order.title,
    fallback: tOrder("reference", { reference: order.reference }),
  });
  const facts: OrderViewFact[] = [
    { key: "customer", label: t("customer"), value: order.customer?.name ?? null },
    { key: "contact", label: t("contact"), value: contactLine({ contact: order.contact }) },
    { key: "when", label: t("when"), value: desiredPeriod({ order, format }) },
    { key: "guests", label: t("guests"), value: String(order.guestCount ?? "–") },
    { key: "assignee", label: t("assignee"), value: order.assignee?.name ?? t("nobody") },
    ...(order.followers.length > 0
      ? [
          {
            key: "followers",
            label: t("followers"),
            value: order.followers.map((f) => f.name).join(", "),
          },
        ]
      : []),
    ...moneyFacts({ order, t, numbers }),
  ];
  return (
    <OrderView
      title={
        <Link href={href} className="hover:underline">
          {name}
        </Link>
      }
      status={order.currentStatus}
      facts={facts}
      hidden={t("hidden")}
      footer={
        <Link href={href} className="text-primary hover:underline">
          {tOrder("open")}
        </Link>
      }
    />
  );
}
