import { z } from "zod";

export const RoomStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);

export const RoomSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  venueId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  floor: z.string().nullable(),
  areaSqm: z.number().nullable(),
  ceilingHeightM: z.number().nullable(),
  hasDaylight: z.boolean(),
  maxCapacity: z.number().int().nullable(),
  status: RoomStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const RoomCreateInputSchema = z.object({
  venueId: z.string().min(1).describe("Id of the venue the room belongs to"),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).nullish(),
  floor: z.string().trim().max(50).nullish().describe("Floor label, e.g. 2 or Entréplan"),
  areaSqm: z.number().positive().max(100_000).nullish().describe("Floor area in m²"),
  ceilingHeightM: z.number().positive().max(100).nullish(),
  hasDaylight: z.boolean().optional(),
  maxCapacity: z.number().int().positive().max(100_000).nullish().describe("Max people"),
});

export const RoomUpdateInputSchema = RoomCreateInputSchema.omit({ venueId: true })
  .partial()
  .extend({ id: z.string().min(1) });

export const RoomIdInputSchema = z.object({ id: z.string().min(1) });

export const RoomListInputSchema = z.object({
  venueId: z.string().optional().describe("Only rooms in this venue"),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional().describe("id of the last item from the previous page"),
});

export const RoomListOutputSchema = z.object({
  items: z.array(RoomSchema),
  nextCursor: z.string().nullable(),
});

export type RoomDto = z.infer<typeof RoomSchema>;
export type RoomCreateInput = z.infer<typeof RoomCreateInputSchema>;
export type RoomUpdateInput = z.infer<typeof RoomUpdateInputSchema>;
