import type { OrderDto, Permission } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { DeferredSection } from "@/components/states/deferred-section";
import { CommentSection } from "@/features/comment/ui/comment-section";
import { OrderMessages } from "@/features/inbound-message/ui/order-messages";
import { ProgramSection } from "@/features/line/ui/program-section";
import { OrderVersions } from "@/features/order-version/ui/order-versions";
import { OrderPayments } from "@/features/payment/ui/order-payments";
import { OrderQuotes } from "@/features/quote/ui/order-quotes";
import { RequirementSection } from "@/features/requirement/ui/requirement-section";
import { RunSheetSection } from "@/features/run-sheet/ui/run-sheet-section";
import { type CallerAbilities, can } from "@/server/caller-abilities";
import type { OrderTab } from "../order-tabs";
import { OrderEstimateHistory } from "./order-estimate-history";
import type { OrderFormData } from "./order-form-data";
import { OrderStatusHistory } from "./order-status-history";

export type OrderSectionsProps = {
  locale: Locale;
  order: OrderDto;
  statuses: OrderFormData["statuses"];
  abilities: CallerAbilities;
  tab: OrderTab;
};

type TabProps = Omit<OrderSectionsProps, "tab"> & {
  allowed: (input: { permission: Permission }) => boolean;
};

/** The program and the counted requirements. */
function ProgramTab({ locale, order }: TabProps) {
  return (
    <>
      <DeferredSection rows={5}>
        <ProgramSection locale={locale} order={order} />
      </DeferredSection>
      <DeferredSection>
        <RequirementSection locale={locale} order={order} />
      </DeferredSection>
    </>
  );
}

/** Quotes, the balance with its requests and payments, and the estimate over time. */
function MoneyTab({ locale, order, statuses, allowed }: TabProps) {
  return (
    <>
      {allowed({ permission: "quote:read" }) ? (
        <DeferredSection>
          <OrderQuotes locale={locale} order={order} statuses={statuses} />
        </DeferredSection>
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
      <DeferredSection>
        <OrderEstimateHistory locale={locale} orderId={order.id} />
      </DeferredSection>
    </>
  );
}

/** What happened on the order: comments, the customer's messages, status moves and versions. */
function ActivityTab({ locale, order, statuses, allowed }: TabProps) {
  return (
    <>
      {allowed({ permission: "comment:read" }) ? (
        <DeferredSection rows={3}>
          <CommentSection locale={locale} order={order} />
        </DeferredSection>
      ) : null}
      <DeferredSection>
        <OrderMessages locale={locale} orderId={order.id} address={order.inboundAddress} />
      </DeferredSection>
      <DeferredSection>
        <OrderStatusHistory locale={locale} orderId={order.id} statuses={statuses} />
      </DeferredSection>
      {allowed({ permission: "program:read" }) ? (
        <DeferredSection>
          <OrderVersions locale={locale} order={order} />
        </DeferredSection>
      ) : null}
    </>
  );
}

/**
 * The open tab's sections, and only those: each tab is its own URL, so the others never load
 * (ADR 0097). Each section belongs to another feature (ADR 0050, feature scope): without that
 * feature's `read` it is left out, not shown as an error, and a tab with nothing readable is
 * left out of the tabs (`availableOrderTabs`). Every section streams in on its own.
 */
export function OrderSections({ tab, ...props }: OrderSectionsProps) {
  const allowed = ({ permission }: { permission: Permission }) =>
    can({ abilities: props.abilities, permission });
  const tabProps = { ...props, allowed };
  return (
    <div className="grid grid-cols-1 gap-12">
      {tab === "program" ? <ProgramTab {...tabProps} /> : null}
      {tab === "run-sheets" ? (
        <DeferredSection>
          <RunSheetSection locale={props.locale} order={props.order} />
        </DeferredSection>
      ) : null}
      {tab === "money" ? <MoneyTab {...tabProps} /> : null}
      {tab === "activity" ? <ActivityTab {...tabProps} /> : null}
    </div>
  );
}
