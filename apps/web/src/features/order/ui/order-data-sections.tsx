import type { OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { AssignmentSection } from "@/features/assignment/ui/assignment-section";
import { handleLoadError } from "@/server/load-error";
import { loadOrderData } from "../load-order-data";
import { OrderDetails } from "./order-facts";

type OrderDataSectionProps = { locale: Locale; order: OrderDto };

/** The order's type, money and own fields; streams in with the types and lists it needs. */
export async function OrderDetailsSection({ locale, order }: OrderDataSectionProps) {
  const data = await loadOrderData();
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return <OrderDetails order={order} data={data.value} />;
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
