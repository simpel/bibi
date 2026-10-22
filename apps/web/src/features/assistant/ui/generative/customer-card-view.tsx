"use client";

import type { CustomerWire } from "@bibi/ai";
import { Link } from "@bibi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { customerRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { fieldLines } from "./item-facts";

export type CustomerCardViewProps = GenerativeProps<"customer-card">;

const addressOf = ({ customer }: { customer: CustomerWire }): string =>
  [
    customer.invoiceStreetAddress,
    [customer.invoicePostalCode, customer.invoiceCity].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

/** One customer: name (link), contact details, invoice address, terms and own field values. */
export function CustomerCardView({ customer }: CustomerCardViewProps) {
  const t = useTranslations("assistant.ui.customer");
  const address = addressOf({ customer });
  const contact = [customer.email, customer.phone].filter(Boolean).join(" · ");
  const terms =
    customer.paymentTermsDays === null ? null : t("terms", { days: customer.paymentTermsDays });
  return (
    <Card data-slot="customer-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={customerRoute({ id: customer.id })} className="hover:underline">
            {customer.name}
          </Link>
        </CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        {contact ? <p>{contact}</p> : null}
        {address ? <p>{address}</p> : null}
        {terms ? <p>{terms}</p> : null}
        {fieldLines({ fields: customer.fields }).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <Link href={customerRoute({ id: customer.id })} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
