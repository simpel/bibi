"use client";

import { Link } from "@bibi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { customerRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { fieldLines } from "./item-facts";

export type ContactCardViewProps = GenerativeProps<"contact-card">;

/** One contact person: name, email, phone and own field values, linking to the customer. */
export function ContactCardView({ contact }: ContactCardViewProps) {
  const t = useTranslations("assistant.ui.contact");
  const href = customerRoute({ id: contact.customerId });
  const reach = [contact.email, contact.phone].filter(Boolean).join(" · ");
  return (
    <Card data-slot="contact-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{contact.name}</CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        {reach ? <p>{reach}</p> : null}
        {fieldLines({ fields: contact.fields }).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <Link href={href} className="text-primary hover:underline">
          {t("openCustomer")}
        </Link>
      </CardContent>
    </Card>
  );
}
