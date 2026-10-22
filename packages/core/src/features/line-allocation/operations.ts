import { assignLineAllocation } from "./assign-operation";
import { getLineAllocation, listLineAllocations } from "./read-operations";

export { assignLineAllocation, getLineAllocation, listLineAllocations };

export const lineAllocationOperations = [
  listLineAllocations,
  getLineAllocation,
  assignLineAllocation,
];
