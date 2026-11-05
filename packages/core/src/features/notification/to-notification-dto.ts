import type { Notification } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { type NotificationData, NotificationDataSchema, type NotificationDto } from "./schema";

type Viewer = { context: Pick<OperationContext, "permissions"> };

/**
 * The snapshot's facts the reader may still see (ADR 0071): order facts need `order:read`, the
 * run sheet's `runSheet:read` and the amount `payment:read`, checked on every read.
 */
function visibleData({ data, context }: Viewer & { data: NotificationData }): NotificationData {
  const { orderReference, orderTitle, fromStatus, toStatus, runSheetName, runSheetVersion } =
    data;
  const { amountMinor, currency, actorName } = data;
  return {
    ...(actorName !== undefined ? { actorName } : {}),
    ...(canView({ context, feature: "order" })
      ? { orderReference, orderTitle, fromStatus, toStatus }
      : {}),
    ...(canView({ context, feature: "runSheet" }) ? { runSheetName, runSheetVersion } : {}),
    ...(canView({ context, feature: "payment" }) ? { amountMinor, currency } : {}),
  };
}

/** Drops keys left undefined, so every surface returns the same object. */
const defined = ({ data }: { data: NotificationData }) =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

/** A stored notification as the caller sees it; an unreadable snapshot shows as empty. */
export function toNotificationDto({
  row,
  context,
}: Viewer & { row: Notification }): NotificationDto {
  const parsed = NotificationDataSchema.safeParse(row.data);
  const data = parsed.success ? defined({ data: visibleData({ data: parsed.data, context }) }) : {};
  return {
    id: row.id,
    kind: row.kind,
    actorUserId: row.actorUserId,
    orderId: row.orderId,
    runSheetId: row.runSheetId,
    paymentId: row.paymentId,
    data,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}
