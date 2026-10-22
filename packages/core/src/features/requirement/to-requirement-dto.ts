import type { Requirement } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { recordFields, WITH_RECORD_LINKS, type WithRecordLinks } from "../../records/record-links";
import type { RequirementDto } from "./schema";

export type RequirementRow = Requirement & WithRecordLinks;

export type ToRequirementDtoInput = { row: RequirementRow };

/** Prisma `include` for every requirement read (`toRequirementDto`): its `LINK` values. */
export const REQUIREMENT_INCLUDE = WITH_RECORD_LINKS;

export const toRequirementDto = ({ row }: ToRequirementDtoInput): RequirementDto => {
  const { record: _record, ...requirement } = row;
  return { ...requirement, fields: recordFields({ row }) };
};

export type LoadRequirementInput = { context: Pick<OperationContext, "db">; id: string };

/** The active requirement, or null when missing, archived or in another organization. */
export async function loadRequirement({
  context,
  id,
}: LoadRequirementInput): Promise<RequirementDto | null> {
  const row = await context.db.requirement.findFirst({
    where: { id },
    include: REQUIREMENT_INCLUDE,
  });
  return row ? toRequirementDto({ row }) : null;
}
