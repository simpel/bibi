import type { OrderViewDto } from "@bibi/core";
import type { OrderViewFact } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { desiredPeriod } from "./desired-period";

type Dates = Parameters<typeof desiredPeriod>[0]["order"];

/** An order from `order.view`, or its JSON form from a tool result (dates as ISO strings). */
export type OrderFactsSource = Dates &
  Pick<
    OrderViewDto,
    "customer" | "contact" | "guestCount" | "assignee" | "followers" | "program" | "balance"
  >;

const contactLine = ({ contact }: { contact: OrderFactsSource["contact"] }) =>
  contact ? [contact.name, contact.email ?? contact.phone].filter(Boolean).join(", ") : null;

/**
 * The order's facts, each null without its feature's read (ADR 0071). Used by the order card and
 * the pinned bookings, so a fact reads the same everywhere.
 */
export function useOrderViewFacts({ order }: { order: OrderFactsSource }): OrderViewFact[] {
  const t = useTranslations("assistant.ui.order.view");
  const format = useDateTimeFormat();
  const numbers = useNumberFormat();
  const { program, balance } = order;
  const total = program ? numbers.money({ minor: program.totalExclVatMinor }) : null;
  return [
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
}
