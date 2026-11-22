import type { OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { PageBands, PageContainer, PageSection } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { PageTour } from "@/components/tour/page-tour";
import { FollowControl } from "@/features/assignment/ui/follow-control";
import { OrderCommentControl } from "@/features/comment/ui/order-comment-control";
import { OrderIssues } from "@/features/line/ui/order-issues";
import { OrderTasks } from "@/features/my-work/ui/order-tasks";
import { orderName } from "@/lib/order-label";
import { orderRoute } from "@/lib/routes";
import { type CallerAbilities, can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadOrder } from "../load-order";
import { orderFormDataPromise } from "../load-order-data";
import { loadOrderNames, loadOrderStatuses } from "../load-order-names";
import { closedStatus, readOnlyAbilities } from "../order-abilities";
import { availableOrderTabs, COMMENTS_TAB, pickOrderTab } from "../order-tabs";
import { ClosedOrderNotice } from "./closed-order-notice";
import { OrderCommentsTabHash } from "./order-comments-tab-hash";
import { OrderKeyFacts } from "./order-facts";
import type { OrderFormData } from "./order-form-data";
import { OrderSections } from "./order-sections";
import { OrderSidePanel } from "./order-side-panel";
import { OrderStatusLabel } from "./order-status-label";
import { OrderStatusMenu } from "./order-status-menu";
import { OrderTabNav } from "./order-tab-nav";
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

/** Top right beside the title: the status (a menu for writers), Follow and comments; the rest edits in place. */
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
          <OrderCommentControl order={order} />
        </Suspense>
      ) : null}
    </>
  );
}

type OrderAttentionProps = {
  order: OrderDto;
  closed: OrderFormData["statuses"][number] | null;
  canProgram: boolean;
};

/**
 * What needs attention on the order, under its heading: the program's issues, the closed notice
 * and the caller's own tasks (Needs you). Hidden while there is nothing.
 */
function OrderAttention({ order, closed, canProgram }: OrderAttentionProps) {
  return (
    <div className="grid gap-4 empty:hidden">
      {canProgram ? (
        // No skeleton: most orders have no issues, so a placeholder would flash and vanish.
        <Suspense fallback={null}>
          <OrderIssues orderId={order.id} />
        </Suspense>
      ) : null}
      {closed ? <ClosedOrderNotice order={order} status={closed} /> : null}
      <Suspense fallback={null}>
        <OrderTasks orderId={order.id} />
      </Suspense>
    </div>
  );
}

export type OrderDetailProps = {
  locale: Locale;
  id: string;
  /** `?tab=`: the open tab; an unknown or hidden one falls back to the first. */
  tab?: string | undefined;
};

export async function OrderDetail({ locale, id, tab: tabParam }: OrderDetailProps) {
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
  // A closed order is a record: its content controls are hidden, not disabled.
  const closed = closedStatus({ order: order.value, statuses: statuses.value });
  const pageAbilities = closed ? readOnlyAbilities({ abilities }) : abilities;
  const tabs = availableOrderTabs({ abilities });
  const tab = pickOrderTab({ value: tabParam, available: tabs });
  const actions = (
    <OrderHeaderActions order={order.value} statuses={statuses.value} abilities={pageAbilities} />
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
      <PageSection>
        <PageContainer width="wide" className="grid grid-cols-1 gap-4 pt-4 pb-0 sm:pt-6 sm:pb-0">
          <PageHeader
            {...heading({ order: order.value, label, short })}
            heading={
              <OrderTitle
                id={id}
                title={order.value.title}
                fallback={label({ reference: order.value.reference })}
                suffix={
                  order.value.title === null
                    ? undefined
                    : short({ reference: order.value.reference })
                }
                canEdit={can({ abilities: pageAbilities, permission: "order:write" })}
              />
            }
            actions={actions}
          />
          <OrderKeyFacts
            order={order.value}
            data={names}
            canEdit={can({ abilities: pageAbilities, permission: "order:write" })}
            formData={orderFormDataPromise()}
          />
          <OrderAttention
            order={order.value}
            closed={closed}
            canProgram={can({ abilities, permission: "program:read" })}
          />
          {/* The tabs close the header: their underline sits on its bottom edge (no bottom padding). */}
          <div className="mt-2">
            <OrderTabNav orderId={id} tabs={tabs} current={tab} />
          </div>
        </PageContainer>
      </PageSection>
      <PageTour tour="order" />
      <PageSection divided>
        {/* Tabs and the facts panel side by side; the panel goes under the tabs on narrow screens. */}
        <PageContainer
          width="wide"
          className="grid grid-cols-1 items-start gap-8 py-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <div className="grid min-w-0 grid-cols-1 gap-8">
            <OrderSections
              locale={locale}
              order={order.value}
              statuses={statuses.value}
              abilities={abilities}
              tab={tab}
            />
          </div>
          <OrderSidePanel locale={locale} order={order.value} abilities={pageAbilities} />
        </PageContainer>
      </PageSection>
      <OrderCommentsTabHash active={tab === COMMENTS_TAB} />
    </PageBands>
  );
}
