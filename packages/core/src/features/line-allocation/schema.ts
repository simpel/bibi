import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";

/**
 * One slot of a demand on a line and the unit that fills it (ADR 0059). Only ids: the demand and
 * the unit are item data, read through `itemDemand.get` and `item.get` (feature scope, ADR 0050).
 */
export const LineAllocationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  lineId: z.string(),
  demandId: z.string().describe("The demand this slot fills (itemDemand.get)"),
  parentAllocationId: z
    .string()
    .nullable()
    .describe(
      "The allocation whose unit has the demand (a chained demand); null = the line's item",
    ),
  slot: z.number().int().describe("Which of the demand's units, from 0"),
  unitId: z.string().nullable().describe("The allocated unit (item.get); null while unfilled"),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const LineAllocationListInputSchema = z.object({
  lineId: z.string().min(1).describe("The line (line.list)"),
  ...PageInputShape,
});

export const LineAllocationListOutputSchema = z.object({
  items: z.array(LineAllocationSchema),
  nextCursor: z.string().nullable(),
});

export const LineAllocationIdInputSchema = z.object({ id: z.string().min(1) });

export const LineAllocationAssignInputSchema = z.object({
  id: z.string().min(1).describe("The allocation (lineAllocation.list)"),
  unitId: z
    .string()
    .min(1)
    .nullable()
    .describe(
      "A unit of the demand's target (item.freeUnits lists the free ones with the prepick); " +
        "null unfills an optional demand",
    ),
});

export type LineAllocationDto = z.infer<typeof LineAllocationSchema>;
export type LineAllocationAssignInput = z.infer<typeof LineAllocationAssignInputSchema>;
