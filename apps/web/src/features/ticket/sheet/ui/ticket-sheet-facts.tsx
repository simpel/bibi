"use client";

import { ContactName } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";
import { customerRoute } from "@/lib/routes";
import type { TicketSheetFacts } from "../load-sheet-facts";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/**
 * One row: who answers for the ticket, the client (to its page) and the contact there; each person
 * opens their contact card.
 */
export function TicketSheetFactsRow({ assignee, customer, contact }: TicketSheetFacts) {
  const t = useTranslations("ticketSheet");
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      <Fact label={t("assignee")}>
        {assignee ? (
          <ContactName contact={{ ...assignee, description: t("assignee") }} />
        ) : (
          t("none")
        )}
      </Fact>
      <Fact label={t("customer")}>
        {customer ? (
          <Link
            href={customerRoute({ id: customer.id })}
            className="underline-offset-4 hover:underline"
          >
            {customer.name}
          </Link>
        ) : (
          t("none")
        )}
      </Fact>
      <Fact label={t("contact")}>
        {contact ? (
          <ContactName
            contact={{ ...contact, avatar: false, description: customer?.name ?? undefined }}
          />
        ) : (
          t("none")
        )}
      </Fact>
    </dl>
  );
}
