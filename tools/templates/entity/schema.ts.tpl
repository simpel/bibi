import { z } from "zod";

// The {{Pascal}} entity. Fields and status values per docs/domain-model.md.
// TODO: add domain fields. Every row has organizationId and audit fields (ADR 0006).
export const {{camel}}Schema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(1),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdBy: z.string(),
});

export type {{Pascal}} = z.infer<typeof {{camel}}Schema>;

export const create{{Pascal}}InputSchema = z.object({
  name: z.string().min(1),
});

export const get{{Pascal}}InputSchema = z.object({
  id: z.string(),
});

export const list{{Pascal}}InputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
});

export type Create{{Pascal}}Input = z.infer<typeof create{{Pascal}}InputSchema>;
