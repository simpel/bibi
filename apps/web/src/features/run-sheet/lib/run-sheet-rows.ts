import {
  type DateTimeFormat,
  deriveRunSheetStatus,
  type RunSheetDto,
  type RunSheetStatus,
} from "@bibi/core/schemas";
import { desiredPeriod } from "@/features/order/ui/desired-period";

type Named = { id: string; name: string };

/** What the table shows of a run sheet, formatted on the server. */
export type RunSheetRow = {
  id: string;
  orderId: string;
  orderLabel: string;
  definition: string;
  responsibility: string;
  when: string;
  version: number;
  current: boolean;
  blocked: boolean;
  status: RunSheetStatus;
  /** Formatted time it was published, null while it has not been. */
  publishedAt: string | null;
  /** Formatted time it was marked fulfilled/done. */
  fulfilledAt: string | null;
  sentAt: string | null;
};

export type RunSheetRowsInput = {
  items: RunSheetDto[];
  definitions: Named[];
  responsibilities: Named[];
  format: DateTimeFormat;
};

const nameOf = ({ rows, id }: { rows: Named[]; id: string }) =>
  rows.find((row) => row.id === id)?.name ?? "–";

/** Rows for the table: names from the lookups, the order row's label and period, times formatted. */
export function toRunSheetRows({
  items,
  definitions,
  responsibilities,
  format,
}: RunSheetRowsInput): RunSheetRow[] {
  return items.map((item) => {
    const order = item.content.rows.find((row) => row.kind === "ORDER");
    return {
      id: item.id,
      orderId: item.orderId,
      orderLabel: order?.label ?? "–",
      definition: nameOf({ rows: definitions, id: item.runSheetDefinitionId }),
      responsibility: nameOf({ rows: responsibilities, id: item.responsibilityId }),
      when: order
        ? desiredPeriod({
            order: { desiredStartsAt: order.startsAt, desiredEndsAt: order.endsAt },
            format,
          })
        : "–",
      version: item.version,
      current: item.current,
      blocked: item.blocked,
      status: deriveRunSheetStatus(item),
      publishedAt: item.publishedAt ? format.dateTime({ instant: item.publishedAt }) : null,
      fulfilledAt: item.fulfilledAt ? format.dateTime({ instant: item.fulfilledAt }) : null,
      sentAt: item.publishedAt ? format.dateTime({ instant: item.publishedAt }) : null,
    };
  });
}
