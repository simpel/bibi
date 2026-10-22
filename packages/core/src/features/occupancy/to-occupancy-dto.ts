import type { Occupancy } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { OccupancyDto } from "./schema";

export type ToOccupancyDtoInput = { row: Occupancy };

export const toOccupancyDto = ({ row }: ToOccupancyDtoInput): OccupancyDto => ({ ...row });

export type LoadOccupancyInput = { context: Pick<OperationContext, "db">; id: string };

/** The active occupancy, or null when missing, released or in another organization. */
export async function loadOccupancy({
  context,
  id,
}: LoadOccupancyInput): Promise<OccupancyDto | null> {
  const row = await context.db.occupancy.findFirst({ where: { id } });
  return row ? toOccupancyDto({ row }) : null;
}
