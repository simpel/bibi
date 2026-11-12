import type { OrderDto } from "@bibi/core";
import { KeyFacts } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { PersonName } from "@/components/people/person-name";
import { type Fact, FactList } from "@/components/typed-fields/fact-list";
import { ownFieldFacts } from "@/components/typed-fields/own-field-facts";
import { Link } from "@/lib/navigation";
import { customerRoute } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import { getNumberFormat } from "@/server/number-format";
import type { OrderNames } from "../load-order-names";
import { desiredWhen } from "./desired-period";
import type { OrderFormData } from "./order-form-data";

export type OrderFactsProps = { order: OrderDto; data: OrderFormData };

const EMPTY = "–";

const count = ({ value }: { value: number | null }) => (value === null ? EMPTY : String(value));

/** Facts without a value are left out, not shown as "–". */
const filled = <T extends Fact>({ facts }: { facts: readonly T[] }) =>
  facts.filter(({ value }) => value !== "" && value !== EMPTY);

/** The booking note as plain text; line breaks are kept. Renders nothing when unset. */
function OrderNote({ note, label }: { note: string | null; label: string }) {
  if (!note) return null;
  return (
    <div>
      <h3 className="text-sm text-muted-foreground">{label}</h3>
      <p className="mt-1 max-w-2xl whitespace-pre-line text-sm">{note}</p>
    </div>
  );
}

export type OrderKeyFactsProps = { order: OrderDto; data: OrderNames };

/** The primary facts under the title: customer, contact, dates and headcounts. */
export async function OrderKeyFacts({ order, data }: OrderKeyFactsProps) {
  const t = await getTranslations("order.fields");
  const common = await getTranslations("common");
  const format = await getDateTimeFormat();
  const hidden = data.customersHidden ? common("hidden") : undefined;
  const guaranteed = order.guaranteedHeadcount;
  const { customerId, contactId } = order;
  const customer = nameOf({ options: data.customers, id: customerId, hidden });
  const when = desiredWhen({ order, format });
  const facts: (Fact & { truncate?: boolean; preheader?: string })[] = [
    {
      label: t("customer"),
      value: customer,
      truncate: true,
      ...(customerId && !hidden
        ? { node: <Link href={customerRoute({ id: customerId })}>{customer}</Link> }
        : {}),
    },
    {
      label: t("contact"),
      value: nameOf({ options: data.contacts, id: contactId, hidden }),
      node: (
        <PersonName
          {...{ options: data.contacts, id: contactId, hidden }}
          description={customerId && !hidden ? customer : undefined}
          avatar={false}
        />
      ),
    },
    { label: t("when"), ...when },
    { label: t("estimatedHeadcount"), value: count({ value: order.estimatedHeadcount }) },
    { label: t("guaranteedHeadcount"), value: count({ value: guaranteed }) },
  ];
  const shown = filled({ facts }).map(({ label, value, node, truncate, preheader }) => ({
    label,
    value: node ?? value,
    ...(preheader ? { preheader } : {}),
    ...(truncate ? { truncate, title: value } : {}),
  }));
  return <KeyFacts facts={shown} />;
}

type ReferenceInput = {
  order: OrderDto;
  fields: Awaited<ReturnType<typeof getTranslations<"order.fields">>>;
};

/** The buyer's reference and where it comes from, or a warning when the customer requires one. */
function referenceValue({ order, fields }: ReferenceInput) {
  const reference = order.effectiveBuyerReference;
  if (reference === null) return fields("buyerReferenceMissing");
  return order.buyerReferenceSource === "CONTACT"
    ? fields("buyerReferenceFromContact", { reference })
    : reference;
}

/**
 * The rest of the order, lower on the page: type, money, holds, own fields and the note. Left
 * out when none is set.
 */
export async function OrderDetails({ order, data }: OrderFactsProps) {
  const t = await getTranslations("order");
  const fields = await getTranslations("order.fields");
  const common = await getTranslations("common");
  const format = await getDateTimeFormat();
  const { money } = await getNumberFormat();
  const type = data.types.find(({ id }) => id === order.entityTypeId);
  const kinds = await getTranslations("customer.buyerKind");
  const kind = kinds(order.effectiveBuyerKind);
  const reference = order.effectiveBuyerReference;
  const amount = ({ minor }: { minor: number | null }) =>
    minor === null ? EMPTY : money({ minor });
  const facts = [
    { label: fields("type"), value: type?.name ?? EMPTY },
    {
      label: fields("buyerKind"),
      value: order.buyerKind ? kind : fields("buyerKindInherited", { kind }),
    },
    ...(reference || order.buyerReferenceMissing
      ? [{ label: fields("buyerReference"), value: referenceValue({ order, fields }) }]
      : []),
    ...(order.statusReason ? [{ label: fields("statusReason"), value: order.statusReason }] : []),
    { label: fields("budget"), value: amount({ minor: order.budgetMinor }) },
    { label: fields("estimatedValue"), value: amount({ minor: order.estimatedValueMinor }) },
    ...(order.holdsUntil
      ? [{ label: fields("holdsUntil"), value: format.dateTime({ instant: order.holdsUntil }) }]
      : []),
    ...ownFieldFacts({
      type,
      stored: order.fields,
      vocabularies: data.vocabularies,
      links: data.links,
      yesNo: { yes: common("yes"), no: common("no") },
    }),
  ];
  const shown = filled({ facts });
  if (shown.length === 0 && !order.note) return null;
  return (
    <section className="grid grid-cols-1 gap-4">
      <h2 className="text-xl">{t("details")}</h2>
      <FactList facts={shown} />
      <OrderNote note={order.note} label={fields("note")} />
    </section>
  );
}
