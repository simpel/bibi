import type { TicketDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { FactList } from "@/components/typed-fields/fact-list";
import { ownFieldFacts } from "@/components/typed-fields/own-field-facts";
import { getDateTimeFormat } from "@/server/date-time-format";
import { getNumberFormat } from "@/server/number-format";
import { desiredPeriod } from "./desired-period";
import type { TicketFormData } from "./ticket-form-data";

export type TicketFactsProps = { ticket: TicketDto; data: TicketFormData };

const count = ({ value }: { value: number | null }) => (value === null ? "–" : String(value));

/** Description list of a ticket: customer, contact, period, counts, budget, status and fields. */
export async function TicketFacts({ ticket, data }: TicketFactsProps) {
  const t = await getTranslations("ticket.fields");
  const common = await getTranslations("common");
  const format = await getDateTimeFormat();
  const { money } = await getNumberFormat();
  const type = data.types.find(({ id }) => id === ticket.entityTypeId);
  const ticketStatus = data.statuses.find(({ id }) => id === ticket.statusId);
  const budget = ticket.budgetMinor;
  const hidden = data.customersHidden ? common("hidden") : undefined;
  const facts = [
    { label: t("type"), value: type?.name ?? "–" },
    {
      label: t("customer"),
      value: nameOf({ options: data.customers, id: ticket.customerId, hidden }),
    },
    {
      label: t("contact"),
      value: nameOf({ options: data.contacts, id: ticket.contactId, hidden }),
    },
    { label: t("when"), value: desiredPeriod({ ticket, format }) },
    { label: t("status"), value: ticketStatus?.name ?? "–" },
    ...(ticket.statusReason ? [{ label: t("statusReason"), value: ticket.statusReason }] : []),
    { label: t("estimatedHeadcount"), value: count({ value: ticket.estimatedHeadcount }) },
    { label: t("guaranteedHeadcount"), value: count({ value: ticket.guaranteedHeadcount }) },
    { label: t("budget"), value: budget === null ? "–" : money({ minor: budget }) },
    ...(ticket.holdsUntil
      ? [{ label: t("holdsUntil"), value: format.dateTime({ instant: ticket.holdsUntil }) }]
      : []),
    ...ownFieldFacts({
      type,
      stored: ticket.fields,
      vocabularies: data.vocabularies,
      links: data.links,
      yesNo: { yes: common("yes"), no: common("no") },
    }),
  ];
  return <FactList facts={facts} />;
}
