import type { OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { PageBand, PageBands } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { PageTour } from "@/components/tour/page-tour";
import { FollowControl } from "@/features/assignment/ui/follow-control";
import { OrderCommentControl } from "@/features/comment/ui/order-comment-control";
import { OrderIssues } from "@/features/line/ui/order-issues";
import { orderName } from "@/lib/order-label";
import { orderRoute } from "@/lib/routes";
import { type CallerAbilities, can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadOrder } from "../load-order";
import { loadOrderNames, loadOrderStatuses } from "../load-order-names";
import { OrderActions } from "./order-actions";
import { OrderKeyFacts } from "./order-facts";
import type { OrderFormData } from "./order-form-data";
import { OrderSections } from "./order-sections";
import { OrderStatusLabel } from "./order-status-label";
import { OrderStatusMenu } from "./order-status-menu";
import { OrderTitle } from "./order-title";

type Heading = {
  order: OrderDto;
  label: (values: { reference: number }) => string;
  short: (values: { reference: number }) => string;
};

/** The title leads with the number after it; an untitled order is headed by its reference. */
function heading({ order, label, short }: Heading) {
  const fallback = label({ reference: order.reference });
  return order.title === null
    ? { title: fallback }
    : {
        title: orderName({ title: order.title, fallback }),
        suffix: short({ reference: order.reference }),
      };
}

type OrderHeaderActionsProps = {
  order: OrderDto;
  statuses: OrderFormData["statuses"];
  abilities: CallerAbilities;
};

/** Top right beside the title: the status (a menu for writers), Follow, comments, then the actions. */
function OrderHeaderActions({ order, statuses, abilities }: OrderHeaderActionsProps) {
  return (
    <>
      {can({ abilities, permission: "order:write" }) ? (
        <OrderStatusMenu order={order} statuses={statuses} />
      ) : (
        <OrderStatusLabel statuses={statuses} id={order.statusId} badge />
      )}
      {abilities.userId ? (
        // Streams in after the header: the first paint does not wait for the followers.
        <Suspense fallback={null}>
          <FollowControl
            subject={{ subjectType: "ORDER", subjectId: order.id }}
            userId={abilities.userId}
          />
        </Suspense>
      ) : null}
      {can({ abilities, permission: "comment:read" }) ? (
        <Suspense fallback={null}>
          <OrderCommentControl order={order} title={order.title ?? `#${order.reference}`} />
        </Suspense>
      ) : null}
      <OrderActions order={order} abilities={abilities} />
    </>
  );
}

export type OrderDetailProps = { locale: Locale; id: string };

export async function OrderDetail({ locale, id }: OrderDetailProps) {
  // The first paint (ADR 0097): the order, its statuses and its own customer and contact.
  const [t, sheet, abilities, order, statuses] = await Promise.all([
    getTranslations("order"),
    getTranslations("orderSheet"),
    getCallerAbilities(),
    loadOrder({ id }),
    loadOrderStatuses(),
  ]);
  const label = ({ reference }: { reference: number }) => t("reference", { reference });
  const short = ({ reference }: { reference: number }) => sheet("reference", { reference });
  if (!order.ok) {
    return <ErrorState errorKey={handleLoadError({ error: order.error, locale })} />;
  }
  if (!statuses.ok) {
    return <ErrorState errorKey={handleLoadError({ error: statuses.error, locale })} />;
  }
  const names = await loadOrderNames({ order: order.value });
  const actions = (
    <OrderHeaderActions order={order.value} statuses={statuses.value} abilities={abilities} />
  );
  return (
    <PageBands>
      <CrumbName
        href={orderRoute({ id })}
        name={
          order.value.reference
            ? `#${order.value.reference} ${order.value.title ?? ""}`.trim()
            : (order.value.title ?? "Order")
        }
      />
      {/* One shrinkable column: a wide table scrolls inside the page instead of widening it. */}
      <PageBand containerClassName="gap-4 pt-4 sm:pt-6">
        {can({ abilities, permission: "program:read" }) ? (
          // Hidden while empty, so a streamed-in alert gets space below it and none otherwise.
          <div className="empty:hidden [&:not(:empty)]:mb-4">
            {/* No skeleton: most orders have no issues, so a placeholder would flash and vanish. */}
            <Suspense fallback={null}>
              <OrderIssues orderId={id} />
            </Suspense>
          </div>
        ) : null}
        <PageHeader
          {...heading({ order: order.value, label, short })}
          heading={
            <OrderTitle
              id={id}
              title={order.value.title}
              fallback={label({ reference: order.value.reference })}
              suffix={
                order.value.title === null ? undefined : short({ reference: order.value.reference })
              }
              canEdit={can({ abilities, permission: "order:write" })}
            />
          }
          actions={actions}
        />
        <OrderKeyFacts order={order.value} data={names} />
      </PageBand>
      <PageTour tour="order" />
      <OrderSections
        locale={locale}
        order={order.value}
        statuses={statuses.value}
        abilities={abilities}
      />
    </PageBands>
  );
}
