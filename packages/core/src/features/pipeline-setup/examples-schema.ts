import { z } from "zod";

const text = ({ max, example }: { max: number; example: string }) =>
  z.string().trim().min(1).max(max).describe(example);

const ClockSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .describe("Local time HH:MM in the organization's time zone");

/** One example line: an item of an existing item type, found or created by name. */
export const ExampleLineSchema = z.object({
  name: text({ max: 200, example: "The line's name, e.g. Lunch" }),
  itemType: text({
    max: 100,
    example: "Name of one of the organization's item types; the line is skipped when none matches",
  }),
  itemName: text({ max: 200, example: "Item in that type, created when missing, e.g. Big hall" }),
  quantity: z.number().int().min(1).max(10_000).optional().describe("Omitted = the headcount"),
  unitPriceMinor: z
    .number()
    .int()
    .min(0)
    .max(100_000_000)
    .optional()
    .describe("Price per unit in minor units (1/100 kr) on the line"),
});

/** One example order: a day from today, a local time span and its lines over that span. */
export const ExampleOrderSchema = z
  .object({
    title: text({ max: 200, example: "The order's title, e.g. Board meeting" }),
    startsInDays: z.number().int().min(1).max(365).describe("Days from today"),
    startTime: ClockSchema,
    endTime: ClockSchema,
    headcount: z.number().int().min(1).max(100_000),
    advance: z
      .boolean()
      .describe("Move it past the entry status into the next open status entered by hand"),
    lines: z.array(ExampleLineSchema).max(10),
  })
  .refine((order) => order.endTime > order.startTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export const PipelineCreateExamplesInputSchema = z.object({
  typeNames: z
    .object({
      customer: text({ max: 100, example: "Customer type name, e.g. Company" }),
      contact: text({ max: 100, example: "Contact type name, e.g. Contact" }),
      order: text({ max: 100, example: "Order type name, e.g. Booking" }),
      line: text({ max: 100, example: "Line type name, e.g. Line" }),
    })
    .describe("Names for the customer, contact, order and line types created when missing"),
  customer: z.object({
    name: text({ max: 200, example: "The example customer's name, e.g. Example Company Ltd" }),
    contactName: text({ max: 200, example: "Its contact person, e.g. Anna Example" }),
    contactEmail: z.email().describe("The contact person's email, e.g. anna@example.com"),
  }),
  orders: z.array(ExampleOrderSchema).max(10).describe("The example orders, created in order"),
});

export const PipelineCreateExamplesOutputSchema = z.object({
  customerId: z.string(),
  orderIds: z.array(z.string()),
});

export type ExampleLine = z.infer<typeof ExampleLineSchema>;
export type ExampleOrder = z.infer<typeof ExampleOrderSchema>;
export type PipelineCreateExamplesInput = z.infer<typeof PipelineCreateExamplesInputSchema>;
export type PipelineCreateExamplesOutput = z.infer<typeof PipelineCreateExamplesOutputSchema>;
