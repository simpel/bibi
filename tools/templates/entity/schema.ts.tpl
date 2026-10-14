import { z } from "zod";

// Entiteten {{Pascal}}. Fält och statusvärden enligt docs/domanmodell.md.
// TODO: lägg till domänfält. Varje rad har organizationId och audit-fält (ADR 0006).
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
