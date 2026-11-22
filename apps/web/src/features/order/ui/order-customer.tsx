import type { OrderDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { EditableSection } from "@/components/inline-edit/editable-section";
import { PersonName } from "@/components/people/person-name";
import { FactList } from "@/components/typed-fields/fact-list";
import { Link } from "@/lib/navigation";
import { customerRoute } from "@/lib/routes";
import type { OrderFormData } from "./order-form-data";
import { OrderInlineEditor } from "./order-inline-editor";

export type OrderCustomerProps = {
  order: OrderDto;
  data: OrderFormData;
  /** May change the contact person (`order:write`, the order not closed). */
  canEdit: boolean;
};

/**
 * Who the order is for, first in the side panel: the customer (set when the order is created,
 * never changed) and the contact person there, whom the pencil changes.
 */
export async function OrderCustomer({ order, data, canEdit }: OrderCustomerProps) {
  const [fields, edit, common] = await Promise.all([
    getTranslations("order.fields"),
    getTranslations("order.inlineEdit"),
    getTranslations("common"),
  ]);
  const hidden = data.customersHidden ? common("hidden") : undefined;
  const customer = nameOf({ options: data.customers, id: order.customerId, hidden });
  const contact = { options: data.contacts, id: order.contactId, hidden };
  return (
    <EditableSection
      title={fields("customer")}
      editLabel={edit("contact")}
      canEdit={canEdit}
      editor={<OrderInlineEditor order={order} data={Promise.resolve(data)} groups={["contact"]} />}
    >
      <FactList
        facts={[
          {
            label: fields("customer"),
            value: customer,
            node: hidden ? undefined : (
              <Link href={customerRoute({ id: order.customerId })}>{customer}</Link>
            ),
          },
          {
            label: fields("contact"),
            value: nameOf(contact),
            node: <PersonName {...contact} description={customer} avatar={false} />,
          },
        ]}
      />
    </EditableSection>
  );
}
