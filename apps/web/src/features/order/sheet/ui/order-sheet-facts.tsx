"use client";

import { ContactName, type KeyFact, KeyFacts } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { desiredWhen } from "@/features/order/ui/desired-period";
import { Link } from "@/lib/navigation";
import { customerRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { OrderSheetFacts } from "../load-sheet-facts";

/**
 * The order page's key facts, the same labels and order: customer (to its page), contact person
 * (their contact card), desired dates (the day above the times) and the headcounts. Facts
 * without a value are left out.
 */
export function OrderSheetFactsRow({ facts }: { facts: OrderSheetFacts }) {
  const t = useTranslations("order.fields");
  const format = useDateTimeFormat();
  const { customer, contact } = facts;
  const when = desiredWhen({ order: facts, format });
  const shown: KeyFact[] = [
    ...(customer
      ? [
          {
            label: t("customer"),
            value: <Link href={customerRoute({ id: customer.id })}>{customer.name}</Link>,
            truncate: true,
            title: customer.name,
          },
        ]
      : []),
    ...(contact
      ? [
          {
            label: t("contact"),
            value: (
              <ContactName
                contact={{ ...contact, avatar: false, description: customer?.name ?? undefined }}
              />
            ),
          },
        ]
      : []),
    ...(when.value !== "–" ? [{ label: t("when"), ...when }] : []),
    ...(facts.estimatedHeadcount === null
      ? []
      : [{ label: t("estimatedHeadcount"), value: facts.estimatedHeadcount }]),
    ...(facts.guaranteedHeadcount === null
      ? []
      : [{ label: t("guaranteedHeadcount"), value: facts.guaranteedHeadcount }]),
  ];
  return <KeyFacts facts={shown} />;
}
