import {
  assignLineAllocation,
  getLineAllocation,
  type LineAllocationDto,
  LineAllocationSchema,
  listLineAllocations,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const LineAllocationRef = objectFromSchema<LineAllocationDto>({
  name: "LineAllocation",
  schema: LineAllocationSchema,
  omit: ["organizationId"],
  description:
    "Line allocation – one slot of a demand on a line and the unit that fills it (ADR 0059); " +
    "only ids, the demand and unit are read through the item feature.",
});
const LineAllocationPageRef = pageType({ name: "LineAllocationPage", item: LineAllocationRef });

fieldFromOperation({
  operation: listLineAllocations,
  type: LineAllocationPageRef,
  name: "lineAllocations",
});
fieldFromOperation({
  operation: getLineAllocation,
  type: LineAllocationRef,
  name: "lineAllocation",
});
mutationFromOperation({ operation: assignLineAllocation, type: LineAllocationRef });
