import { z } from "zod";
import { BOOKING_PHASES } from "../booking-status/schema";
import { InquiryStatusSchema } from "../inquiry/schema";

export const PipelineKindSchema = z.enum(["INQUIRY", "BOOKING"]);

export const PipelineColumnSchema = z.object({
  id: z.string().describe("`inquiry:<STATUS>` or `booking:<bookingStatusId>`"),
  kind: PipelineKindSchema,
  title: z.string().describe("The booking status name, or the inquiry status key"),
  color: z.string().nullable().describe("The booking status colour; null for inquiry columns"),
  inquiryStatus: InquiryStatusSchema.nullable(),
  bookingStatusId: z.string().nullable(),
  phase: z.enum(BOOKING_PHASES).nullable(),
  closed: z.boolean().describe("Lost inquiries and cancelled bookings; shown in a collapsed lane"),
});

export const PipelineCardSchema = z.object({
  id: z.string().describe("Inquiry or booking id"),
  kind: PipelineKindSchema,
  columnId: z.string(),
  reference: z.number().int().nullable().describe("Booking reference number; null for inquiries"),
  typeName: z.string(),
  customerName: z.string(),
  startsAt: z.date().nullable(),
  endsAt: z.date().nullable(),
  quantity: z.number().int().nullable().describe("Requested quantity or estimated headcount"),
  assigneeId: z.string().nullable().describe("Main assignee (user id)"),
});

export const PipelineBoardInputSchema = z.object({
  assigneeId: z.string().optional().describe("Only items this user is assigned to"),
  entityTypeId: z.string().optional().describe("Only inquiries and bookings of this type"),
  closedWithinDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .default(30)
    .describe("Show completed, cancelled and lost items changed within this many days"),
});

export const PipelineBoardSchema = z.object({
  columns: z.array(PipelineColumnSchema),
  cards: z.array(PipelineCardSchema),
});

export type PipelineColumn = z.infer<typeof PipelineColumnSchema>;
export type PipelineCard = z.infer<typeof PipelineCardSchema>;
export type PipelineBoard = z.infer<typeof PipelineBoardSchema>;
export type PipelineBoardInput = z.infer<typeof PipelineBoardInputSchema>;
