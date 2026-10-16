import type { Requirement } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { RequirementDto } from "./schema";

export type ToRequirementDtoInput = { row: Requirement };

export const toRequirementDto = ({ row }: ToRequirementDtoInput): RequirementDto => ({
  ...row,
  fields: asFieldValues({ value: row.fields }),
});

export type LoadRequirementInput = { context: Pick<OperationContext, "db">; id: string };

/** The active requirement, or null when missing, archived or in another organization. */
export async function loadRequirement({
  context,
  id,
}: LoadRequirementInput): Promise<RequirementDto | null> {
  const row = await context.db.requirement.findFirst({ where: { id } });
  return row ? toRequirementDto({ row }) : null;
}
