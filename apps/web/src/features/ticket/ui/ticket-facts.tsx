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

type Translate = Awaited<ReturnType<typeof getTranslations>>;
type CountInput = {
  ticket: TicketDto;
  t: Translate;
  money: ({ minor }: { minor: number }) => string;
};

/** Headcounts, budget and estimated value. */
function countFacts({ ticket, t, money }: CountInput) {
  const budget = ticket.budgetMinor;
  const estimate = ticket.estimatedValueMinor;
  return [
    { label: t("estimatedHeadcount"), value: count({ value: ticket.estimatedHeadcount }) },
    { label: t("guaranteedHeadcount"), value: count({ value: ticket.guaranteedHeadcount }) },
    { label: t("budget"), value: budget === null ? "–" : money({ minor: budget }) },
    { label: t("estimatedValue"), value: estimate === null ? "–" : money({ minor: estimate }) },
  ];
}

/** The booking note as plain text; line breaks are kept. Renders nothing when unset. */
function TicketNote({ note, label }: { note: string | null; label: string }) {
  if (!note) return null;
  return (
    <div>
      <h2 className="text-sm text-muted-foreground">{label}</h2>
      <p className="mt-1 max-w-2xl whitespace-pre-line text-sm">{note}</p>
    </div>
  );
}

/** Description list of a ticket: customer, contact, period, counts, budget, status and fields, then the booking note. */
export async function TicketFacts({ ticket, data }: TicketFactsProps) {
  const t = await getTranslations("ticket.fields");
  const common = await getTranslations("common");
  const format = await getDateTimeFormat();
  const { money } = await getNumberFormat();
  const type = data.types.find(({ id }) => id === ticket.entityTypeId);
  const ticketStatus = data.statuses.find(({ id }) => id === ticket.statusId);
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
    ...countFacts({ ticket, t, money }),
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
  return (
    <div className="grid gap-4">
      <FactList facts={facts} />
      <TicketNote note={ticket.note} label={t("note")} />
    </div>
  );
}
