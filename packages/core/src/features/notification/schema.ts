import { z } from "zod";

/** What a member is told about (ADR 0094): a closed list, a new kind is a code change. */
export const NOTIFICATION_KINDS = [
  "ASSIGNED",
  "RUN_SHEET_SENT",
  "ORDER_STATUS_CHANGED",
  "PAYMENT_RECEIVED",
] as const;
export const NotificationKindSchema = z.enum(NOTIFICATION_KINDS);
export type NotificationKind = z.infer<typeof NotificationKindSchema>;

/** The display facts copied when the notification was made (ADR 0051 snapshot). */
export const NotificationDataSchema = z.object({
  actorName: z.string().optional().describe("Name of the member who caused it"),
  orderReference: z.number().int().optional().describe("The order's reference number"),
  orderTitle: z.string().nullable().optional().describe("The order's title at the time"),
  fromStatus: z.string().nullable().optional().describe("ORDER_STATUS_CHANGED: the old status"),
  toStatus: z.string().optional().describe("ORDER_STATUS_CHANGED: the new status"),
  runSheetName: z.string().optional().describe("RUN_SHEET_SENT: the run sheet's definition"),
  runSheetVersion: z.number().int().optional().describe("RUN_SHEET_SENT: the version sent"),
  amountMinor: z.number().int().optional().describe("PAYMENT_RECEIVED: amount in minor units"),
  currency: z.string().optional().describe("PAYMENT_RECEIVED: ISO 4217 currency"),
  overpaid: z
    .boolean()
    .optional()
    .describe("PAYMENT_RECEIVED: money arrived on a payment already paid (give it back or keep)"),
});
export type NotificationData = z.infer<typeof NotificationDataSchema>;

/** One of the caller's own notifications (ADR 0094). */
export const NotificationSchema = z.object({
  id: z.string(),
  kind: NotificationKindSchema,
  actorUserId: z.string().nullable().describe("Who caused it; null for the system"),
  orderId: z.string().nullable(),
  runSheetId: z.string().nullable(),
  paymentId: z.string().nullable(),
  data: NotificationDataSchema,
  readAt: z.date().nullable().describe("When the caller read it; null = unread"),
  createdAt: z.date(),
});
export type NotificationDto = z.infer<typeof NotificationSchema>;

/** JSON form of a notification (tool results, the live stream): dates are ISO strings. */
export const NotificationWireSchema = NotificationSchema.extend({
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type NotificationWire = z.infer<typeof NotificationWireSchema>;

export const NotificationIdsInputSchema = z.object({
  ids: z.array(z.string()).min(1).max(100).describe("Ids of the caller's own notifications"),
});
export type NotificationIdsInput = z.infer<typeof NotificationIdsInputSchema>;

export const NotificationMarkOutputSchema = z.object({
  updated: z.number().int().describe("How many notifications changed"),
  unread: z.number().int().describe("The caller's unread count afterwards"),
});

export const NotificationDeleteOutputSchema = z.object({
  deleted: z.number().int().describe("How many notifications were deleted"),
  unread: z.number().int().describe("The caller's unread count afterwards"),
});

export const NotificationUnreadCountOutputSchema = z.object({
  unread: z.number().int().describe("How many of the caller's notifications are unread"),
});

export const NotificationNoInputSchema = z.object({});
