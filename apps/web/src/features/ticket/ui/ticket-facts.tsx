import type { TicketDto } from "@bibi/core";
import { cn } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { type Fact, FactList } from "@/components/typed-fields/fact-list";
import { ownFieldFacts } from "@/components/typed-fields/own-field-facts";
import { getDateTimeFormat } from "@/server/date-time-format";
import { getNumberFormat } from "@/server/number-format";
import { desiredPeriod } from "./desired-period";
import type { TicketFormData } from "./ticket-form-data";

export type TicketFactsProps = { ticket: TicketDto; data: TicketFormData };

const EMPTY = "–";

const count = ({ value }: { value: number | null }) => (value === null ? EMPTY : String(value));

/** Facts without a value are left out, not shown as "–". */
const filled = <T extends Fact>({ facts }: { facts: readonly T[] }) =>
  facts.filter(({ value }) => value !== "" && value !== EMPTY);

/** The booking note as plain text; line breaks are kept. Renders nothing when unset. */
function TicketNote({ note, label }: { note: string | null; label: string }) {
  if (!note) return null;
  return (
    <div>
      <h3 className="text-sm text-muted-foreground">{label}</h3>
      <p className="mt-1 max-w-2xl whitespace-pre-line text-sm">{note}</p>
    </div>
  );
}

type KeyFact = Fact & { truncate?: boolean };

/**
 * The primary facts in one row, in the stat cards' type without their frame: each as wide as its
 * value, which may wrap; a truncating fact (the customer) gives way first.
 */
function KeyFactRow({ facts }: { facts: readonly KeyFact[] }) {
  return (
    <dl className="flex gap-x-10">
      {facts.map(({ label, value, truncate }) => (
        <div key={label} className={cn("grid gap-1", truncate && "min-w-0 shrink-[999]")}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd
            title={truncate ? value : undefined}
            className={cn("font-serif text-2xl font-light tracking-tight", truncate && "truncate")}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The primary facts under the title: customer, contact, dates and headcounts. */
export async function TicketKeyFacts({ ticket, data }: TicketFactsProps) {
  const t = await getTranslations("ticket.fields");
  const common = await getTranslations("common");
  const format = await getDateTimeFormat();
  const hidden = data.customersHidden ? common("hidden") : undefined;
  const guaranteed = ticket.guaranteedHeadcount;
  const facts = [
    {
      label: t("customer"),
      value: nameOf({ options: data.customers, id: ticket.customerId, hidden }),
      truncate: true,
    },
    {
      label: t("contact"),
      value: nameOf({ options: data.contacts, id: ticket.contactId, hidden }),
    },
    { label: t("when"), value: desiredPeriod({ ticket, format }) },
    { label: t("estimatedHeadcount"), value: count({ value: ticket.estimatedHeadcount }) },
    { label: t("guaranteedHeadcount"), value: count({ value: guaranteed }) },
  ];
  return <KeyFactRow facts={filled({ facts })} />;
}

/**
 * The rest of the ticket, lower on the page: type, money, holds, own fields and the note. Left
 * out when none is set.
 */
export async function TicketDetails({ ticket, data }: TicketFactsProps) {
  const t = await getTranslations("ticket");
  const fields = await getTranslations("ticket.fields");
  const common = await getTranslations("common");
  const format = await getDateTimeFormat();
  const { money } = await getNumberFormat();
  const type = data.types.find(({ id }) => id === ticket.entityTypeId);
  const amount = ({ minor }: { minor: number | null }) =>
    minor === null ? EMPTY : money({ minor });
  const facts = [
    { label: fields("type"), value: type?.name ?? EMPTY },
    ...(ticket.statusReason ? [{ label: fields("statusReason"), value: ticket.statusReason }] : []),
    { label: fields("budget"), value: amount({ minor: ticket.budgetMinor }) },
    { label: fields("estimatedValue"), value: amount({ minor: ticket.estimatedValueMinor }) },
    ...(ticket.holdsUntil
      ? [{ label: fields("holdsUntil"), value: format.dateTime({ instant: ticket.holdsUntil }) }]
      : []),
    ...ownFieldFacts({
      type,
      stored: ticket.fields,
      vocabularies: data.vocabularies,
      links: data.links,
      yesNo: { yes: common("yes"), no: common("no") },
    }),
  ];
  const shown = filled({ facts });
  if (shown.length === 0 && !ticket.note) return null;
  return (
    <section className="grid grid-cols-1 gap-4">
      <h2 className="text-xl">{t("details")}</h2>
      <FactList facts={shown} />
      <TicketNote note={ticket.note} label={fields("note")} />
    </section>
  );
}
