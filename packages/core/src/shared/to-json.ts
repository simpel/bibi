import type { Prisma } from "@bibi/db";

export type ToJsonInput = { value: unknown };

/** Plain JSON copy for Prisma `Json` columns (drops undefined, serialises dates). */
export function toJson({ value }: ToJsonInput): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
