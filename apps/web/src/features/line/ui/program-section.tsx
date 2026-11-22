import { lineAmounts, type OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ErrorState } from "@/components/states/error-state";
import { AlternativeGroupSection } from "@/features/alternative-group/ui/alternative-group-section";
import { loadOrderComments } from "@/features/comment/load-order-comments";
import { getOrderAbilities } from "@/features/order/order-abilities";
import { OrderVersions } from "@/features/order-version/ui/order-versions";
import {
  VersionsPanel,
  VersionsPanelProvider,
  VersionsToggle,
} from "@/features/order-version/ui/versions-panel";
import { type CallerAbilities, can } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadOrderLines } from "../load-order-lines";
import { loadProgramData } from "../load-program-data";
import { nestedLines } from "../nested-lines";
import { CreateLineButton } from "./create-line-button";
import { ExpandBundleButton } from "./expand-bundle-button";
import { OrderDay } from "./order-day";
import type { ProgramAccess } from "./program-access";
import { ProgramTable } from "./program-table";

export type ProgramSectionProps = { locale: Locale; order: OrderDto };

/** Editing a line and changing its state are `program:write`, removing it `program:delete`. */
function programAccess({ abilities }: { abilities: CallerAbilities }): ProgramAccess {
  const canWrite = can({ abilities, permission: "program:write" });
  const canRemove = can({ abilities, permission: "program:delete" });
  const canAllocate = canWrite && can({ abilities, permission: "item:read" });
  return { canEdit: canWrite, canRemove, canChangeState: canWrite, canAllocate };
}

type ProgramHeaderProps = {
  title: string;
  versionsLabel: string;
  order: OrderDto;
  canEdit: boolean;
  start: Parameters<typeof CreateLineButton>[0];
};

/**
 * The section's title, Versions (ADR 0116), and the add buttons for a caller who may edit the
 * program.
 */
function ProgramHeader({ title, versionsLabel, order, canEdit, start }: ProgramHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl">{title}</h2>
      <div className="flex flex-wrap justify-end gap-2">
        <VersionsToggle label={versionsLabel} />
        {canEdit ? (
          <>
            <ExpandBundleButton {...start} />
            <CreateLineButton {...start} />
          </>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The order's run schedule (ADR 0022): its days in the calendar, the lines in time order with
 * their amounts and the total, edited inline, then its alternatives. Its versions (ADR 0116) open
 * under the header from Versions.
 */
export async function ProgramSection({ locale, order }: ProgramSectionProps) {
  const [t, versions, common] = await Promise.all([
    getTranslations("line"),
    getTranslations("orderVersion"),
    getTranslations("common"),
  ]);
  const access = programAccess({ abilities: await getOrderAbilities({ order }) });
  const [lines, data, amounts, comments] = await Promise.all([
    loadOrderLines({ orderId: order.id }),
    loadProgramData(),
    runOperation({ operation: lineAmounts, input: { orderId: order.id } }),
    loadOrderComments({ order }),
  ]);
  const commentState = comments.ok ? comments.value : null;
  if (!lines.ok && lines.error.code === "FORBIDDEN") return null;
  if (!lines.ok) {
    return <ErrorState inline errorKey={handleLoadError({ error: lines.error, locale })} />;
  }
  if (!data.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: data.error, locale })} />;
  const items = nestedLines({ lines: lines.value.items });
  const start = {
    data: data.value,
    orderId: order.id,
    startsAt: order.desiredStartsAt ?? new Date(),
  };
  return (
    <>
      <section className="grid grid-cols-1 gap-4">
        <VersionsPanelProvider>
          <ProgramHeader
            {...{ order, start, title: t("plural"), versionsLabel: versions("title") }}
            canEdit={access.canEdit}
          />
          <VersionsPanel title={versions("title")} closeLabel={common("close")}>
            <Suspense fallback={null}>
              <OrderVersions locale={locale} order={order} />
            </Suspense>
          </VersionsPanel>
        </VersionsPanelProvider>
        <div className="overflow-hidden rounded-xl border bg-card">
          <OrderDay
            orderId={order.id}
            orderReference={order.reference}
            lines={items}
            data={data.value}
            joined
            comments={commentState}
          />
          {items.length === 0 ? (
            <p className="border-t p-4 text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ProgramTable
              lines={items}
              data={data.value}
              access={access}
              amounts={amounts.ok ? amounts.value : null}
              flush
              comments={commentState}
            />
          )}
        </div>
      </section>
      <AlternativeGroupSection locale={locale} order={order} />
    </>
  );
}
