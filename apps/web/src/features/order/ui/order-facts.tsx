import type { OrderDto } from "@bibi/core";
import { KeyFacts } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { nameOf } from "@/components/form/named-option";
import { EditableFact } from "@/components/inline-edit/editable-fact";
import { PersonName } from "@/components/people/person-name";
import type { Fact } from "@/components/typed-fields/fact-list";
import { Link } from "@/lib/navigation";
import { customerRoute } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import type { OrderNames } from "../load-order-names";
import { desiredWhen } from "./desired-period";
import type { OrderFormData } from "./order-form-data";
import type { OrderEditGroup } from "./order-form-schema";
import { OrderInlineEditor } from "./order-inline-editor";

export const EMPTY = "–";

const count = ({ value }: { value: number | null }) => (value === null ? EMPTY : String(value));

/** Facts without a value are left out, not shown as "–". */
export const filled = <T extends Fact>({ facts }: { facts: readonly T[] }) =>
  facts.filter(({ value }) => value !== "" && value !== EMPTY);

export type OrderKeyFactsProps = {
  order: OrderDto;
  data: OrderNames;
  /** May edit the order (`order:write`, and it is not closed): each fact edits in place. */
  canEdit: boolean;
  /** The data the in-place editors need, not awaited by the page (ADR 0097). */
  formData: Promise<OrderFormData | null>;
};

type KeyFact = Fact & { truncate?: boolean; preheader?: string; keep?: boolean };

/**
 * The primary facts under the title: customer, contact, dates and headcounts, each edited where
 * it is shown. An editable fact shows even when empty, so it can be filled in.
 */
export async function OrderKeyFacts({ order, data, canEdit, formData }: OrderKeyFactsProps) {
  const [t, edit, common, format] = await Promise.all([
    getTranslations("order.fields"),
    getTranslations("order.inlineEdit"),
    getTranslations("common"),
    getDateTimeFormat(),
  ]);
  const hidden = data.customersHidden ? common("hidden") : undefined;
  const { customerId, contactId, estimatedHeadcount, guaranteedHeadcount } = order;
  const customer = nameOf({ options: data.customers, id: customerId, hidden });
  const when = desiredWhen({ order, format });
  const editable = ({ group, node }: { group: OrderEditGroup; node: ReactNode }) => (
    <EditableFact
      editLabel={edit(group)}
      canEdit={canEdit}
      editor={<OrderInlineEditor order={order} data={formData} groups={[group]} />}
    >
      {node}
    </EditableFact>
  );
  const customerNode =
    customerId && !hidden ? (
      <Link href={customerRoute({ id: customerId })}>{customer}</Link>
    ) : (
      customer
    );
  const facts: KeyFact[] = [
    {
      label: t("customer"),
      value: customer,
      truncate: true,
      node: editable({ group: "party", node: customerNode }),
    },
    {
      label: t("contact"),
      value: nameOf({ options: data.contacts, id: contactId, hidden }),
      node: editable({
        group: "party",
        node: (
          <PersonName
            {...{ options: data.contacts, id: contactId, hidden }}
            description={customerId && !hidden ? customer : undefined}
            avatar={false}
          />
        ),
      }),
    },
    {
      label: t("when"),
      ...when,
      node: editable({ group: "period", node: when.value }),
      keep: canEdit,
    },
    {
      label: t("estimatedHeadcount"),
      value: count({ value: estimatedHeadcount }),
      node: editable({ group: "headcount", node: count({ value: estimatedHeadcount }) }),
      keep: canEdit,
    },
    {
      label: t("guaranteedHeadcount"),
      value: count({ value: guaranteedHeadcount }),
      node: editable({ group: "headcount", node: count({ value: guaranteedHeadcount }) }),
    },
  ];
  const shown = facts
    .filter((fact) => fact.keep || filled({ facts: [fact] }).length > 0)
    .map(({ label, value, node, truncate, preheader }) => ({
      label,
      value: node ?? value,
      ...(preheader ? { preheader } : {}),
      ...(truncate ? { truncate, title: value } : {}),
    }));
  return <KeyFacts facts={shown} />;
}
