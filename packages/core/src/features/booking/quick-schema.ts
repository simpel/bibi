import { z } from "zod";

export const QUICK_BOOKING_PAYMENT_METHODS = ["INVOICE", "PAYMENT_LINK"] as const;

export const QuickBookingInputSchema = z.object({
  entityTypeId: z.string().min(1).describe("Id of the booking type (entityType.list base BOOKING)"),
  programItemTypeId: z
    .string()
    .min(1)
    .describe("Id of the program item type (entityType.list base PROGRAM_ITEM)"),
  customerId: z.string().min(1).describe("Id of the customer who orders (customer.list)"),
  itemId: z.string().min(1).describe("Id of the bookable item to occupy (item.list BOOKABLE)"),
  setupId: z
    .string()
    .min(1)
    .nullish()
    .describe("Id of one of the item's setups; adds its changeover time before"),
  startsAt: z.coerce.date().describe("Start, ISO 8601"),
  endsAt: z.coerce.date().describe("End (after the start), ISO 8601"),
  quantity: z.number().int().min(0).max(100_000).describe("How many take part"),
  paymentMethod: z
    .enum(QUICK_BOOKING_PAYMENT_METHODS)
    .describe(
      "INVOICE confirms the booking at once (to the default CONFIRMED status); PAYMENT_LINK " +
        "leaves it TENTATIVE until the payment is done",
    ),
  coordinatorId: z
    .string()
    .min(1)
    .nullish()
    .describe("User id of the coordinator (a member); defaults to the user who books"),
  salesOwnerId: z
    .string()
    .min(1)
    .nullish()
    .describe("User id of the salesperson (a member); defaults to none"),
});

export type QuickBookingInput = z.infer<typeof QuickBookingInputSchema>;
