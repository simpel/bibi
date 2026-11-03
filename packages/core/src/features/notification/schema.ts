import { z } from "zod";

/** What a member is told about (ADR 0094): a closed list, a new kind is a code change. */
export const NOTIFICATION_KINDS = [
  "ASSIGNED",
  "WORK_ORDER_SENT",
  "TICKET_STATUS_CHANGED",
  "PAYMENT_RECEIVED",
] as const;
export const NotificationKindSchema = z.enum(NOTIFICATION_KINDS);
export type NotificationKind = z.infer<typeof NotificationKindSchema>;

/** The display facts copied when the notification was made (ADR 0051 snapshot). */
export const NotificationDataSchema = z.object({
  actorName: z.string().optional().describe("Name of the member who caused it"),
  ticketReference: z.number().int().optional().describe("The ticket's reference number"),
  ticketTitle: z.string().nullable().optional().describe("The ticket's title at the time"),
  fromStatus: z.string().nullable().optional().describe("TICKET_STATUS_CHANGED: the old status"),
  toStatus: z.string().optional().describe("TICKET_STATUS_CHANGED: the new status"),
  workOrderName: z.string().optional().describe("WORK_ORDER_SENT: the work order's definition"),
  workOrderVersion: z.number().int().optional().describe("WORK_ORDER_SENT: the version sent"),
  amountMinor: z.number().int().optional().describe("PAYMENT_RECEIVED: amount in minor units"),
  currency: z.string().optional().describe("PAYMENT_RECEIVED: ISO 4217 currency"),
});
export type NotificationData = z.infer<typeof NotificationDataSchema>;

/** One of the caller's own notifications (ADR 0094). */
export const NotificationSchema = z.object({
  id: z.string(),
  kind: NotificationKindSchema,
  actorUserId: z.string().nullable().describe("Who caused it; null for the system"),
  ticketId: z.string().nullable(),
  workOrderId: z.string().nullable(),
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

export const NotificationUnreadCountOutputSchema = z.object({
  unread: z.number().int().describe("How many of the caller's notifications are unread"),
});

export const NotificationNoInputSchema = z.object({});
