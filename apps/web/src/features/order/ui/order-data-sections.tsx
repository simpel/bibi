import type { OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { AssignmentSection } from "@/features/assignment/ui/assignment-section";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadOrderData } from "../load-order-data";
import { loadOrderStatuses } from "../load-order-names";
import { closedStatus } from "../order-abilities";
import { OrderDetails } from "./order-details";
import type { OrderEditGroup } from "./order-form-schema";

type OrderDataSectionProps = { locale: Locale; order: OrderDto };

/** The order's type, money and own fields, edited in place; streams in with what it needs. */
export async function OrderDetailsSection({ locale, order }: OrderDataSectionProps) {
  const [data, abilities, statuses] = await Promise.all([
    loadOrderData(),
    getCallerAbilities(),
    loadOrderStatuses(),
  ]);
  if (!data.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: data.error, locale })} />;
  // A closed order still takes the buyer fields its invoices need (core `order.update`).
  const closed = statuses.ok && closedStatus({ order, statuses: statuses.value }) !== null;
  const groups: OrderEditGroup[] = closed ? ["buyer"] : ["buyer", "money", "fields"];
  const canEdit = can({ abilities, permission: "order:write" });
  return <OrderDetails order={order} data={data.value} canEdit={canEdit} groups={groups} />;
}

/** Who works the order; streams in with the members it can assign. */
export async function OrderAssignmentSection({ locale, order }: OrderDataSectionProps) {
  const data = await loadOrderData();
  const members = data.ok ? data.value.members : [];
  return (
    <AssignmentSection
      locale={locale}
      subject={{ subjectType: "ORDER", subjectId: order.id }}
      members={members}
    />
  );
}
