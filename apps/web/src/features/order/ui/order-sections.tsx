import type { OrderDto, Permission } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { PageBand } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
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
 * The order's page sections as bands: program, needs and run sheets, details and people,
 * messages, money and status history. Each section belongs to another feature (ADR 0050,
 * feature scope): without that feature's `read` it is left out, not shown as an error, and a
 * band left with nothing is not rendered. Every section that loads its own data streams in on
 * its own.
 */
export async function OrderSections({ locale, order, statuses, abilities }: OrderSectionsProps) {
  const t = await getTranslations("order.groups");
  const allowed = ({ permission }: { permission: Permission }) => can({ abilities, permission });
  const canProgram = allowed({ permission: "program:read" });
  const canRunSheets = allowed({ permission: "runSheet:read" });
  return (
    <>
      {canProgram ? (
        <PageBand aria-label={t("program")} data-tour="order.program" containerClassName="gap-12">
          <DeferredSection rows={5}>
            <ProgramSection locale={locale} order={order} />
          </DeferredSection>
        </PageBand>
      ) : null}
      {canProgram || canRunSheets ? (
        <PageBand aria-label={t("needs")} data-tour="order.needs" containerClassName="gap-12">
          {canProgram ? (
            <DeferredSection>
              <RequirementSection locale={locale} order={order} />
            </DeferredSection>
          ) : null}
          {canRunSheets ? (
            <DeferredSection>
              <RunSheetSection locale={locale} order={order} />
            </DeferredSection>
          ) : null}
        </PageBand>
      ) : null}
      <PageBand
        aria-label={t("people")}
        data-tour="order.details"
        containerClassName="items-start gap-12 md:grid-cols-2"
      >
        <DeferredSection rows={2}>
          <OrderDetailsSection locale={locale} order={order} />
        </DeferredSection>
        <DeferredSection rows={2}>
          <OrderAssignmentSection locale={locale} order={order} />
        </DeferredSection>
      </PageBand>
      <PageBand aria-label={t("messages")} containerClassName="gap-12">
        <DeferredSection>
          <OrderMessages locale={locale} orderId={order.id} address={order.inboundAddress} />
        </DeferredSection>
      </PageBand>
      <PageBand aria-label={t("money")} data-tour="order.money" containerClassName="gap-12">
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
      </PageBand>
      <PageBand aria-label={t("history")} containerClassName="gap-12">
        <DeferredSection>
          <OrderStatusHistory locale={locale} orderId={order.id} statuses={statuses} />
        </DeferredSection>
      </PageBand>
    </>
  );
}
