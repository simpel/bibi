import type { OrderDto, Permission } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { DeferredSection } from "@/components/states/deferred-section";
import { OrderMessages } from "@/features/inbound-message/ui/order-messages";
import { ProgramSection } from "@/features/line/ui/program-section";
import { OrderPayments } from "@/features/payment/ui/order-payments";
import { OrderQuotes } from "@/features/quote/ui/order-quotes";
import { RequirementSection } from "@/features/requirement/ui/requirement-section";
import { RunSheetSection } from "@/features/run-sheet/ui/run-sheet-section";
import { type CallerAbilities, can } from "@/server/caller-abilities";
import { OrderAssignmentSection, OrderDetailsSection } from "./order-data-sections";
import { OrderEstimateHistory } from "./order-estimate-history";
import type { OrderFormData } from "./order-form-data";
import { OrderStatusHistory } from "./order-status-history";

export type OrderSectionsProps = {
  locale: Locale;
  order: OrderDto;
  statuses: OrderFormData["statuses"];
  abilities: CallerAbilities;
};

/**
 * The order page's sections, the daily work first: lines, then money, then the rest of the
 * order, and its record (quote versions, status and estimate history) last. Each belongs to
 * another feature (ADR 0050, feature scope): without that feature's `read` the section is left
 * out, not shown as an error. Every section that loads its own data streams in on its own.
 */
export function OrderSections({ locale, order, statuses, abilities }: OrderSectionsProps) {
  const allowed = ({ permission }: { permission: Permission }) => can({ abilities, permission });
  return (
    <>
      {allowed({ permission: "program:read" }) ? (
        <>
          <DeferredSection rows={5}>
            <ProgramSection locale={locale} order={order} />
          </DeferredSection>
          <DeferredSection>
            <RequirementSection locale={locale} order={order} />
          </DeferredSection>
        </>
      ) : null}
      {allowed({ permission: "payment:read" }) ? (
        <DeferredSection>
          <OrderPayments
            locale={locale}
            orderId={order.id}
            canRequest={allowed({ permission: "payment:write" })}
          />
        </DeferredSection>
      ) : null}
      <DeferredSection rows={2}>
        <OrderDetailsSection locale={locale} order={order} />
      </DeferredSection>
      <DeferredSection rows={2}>
        <OrderAssignmentSection locale={locale} order={order} />
      </DeferredSection>
      {allowed({ permission: "runSheet:read" }) ? (
        <DeferredSection>
          <RunSheetSection locale={locale} order={order} />
        </DeferredSection>
      ) : null}
      <DeferredSection>
        <OrderMessages locale={locale} orderId={order.id} address={order.inboundAddress} />
      </DeferredSection>
      {allowed({ permission: "quote:read" }) ? (
        <DeferredSection>
          <OrderQuotes locale={locale} order={order} statuses={statuses} />
        </DeferredSection>
      ) : null}
      <DeferredSection>
        <OrderStatusHistory locale={locale} orderId={order.id} statuses={statuses} />
      </DeferredSection>
      <DeferredSection>
        <OrderEstimateHistory locale={locale} orderId={order.id} />
      </DeferredSection>
    </>
  );
}
