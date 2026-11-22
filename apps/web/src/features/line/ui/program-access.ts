import type { RowAccess } from "@/lib/can";

/**
 * Edit and remove follow `program:*`; changing a line's state and following the status are
 * `program:write`; choosing a unit needs `program:write` and reading items (ADR 0050, 0059).
 */
export type ProgramAccess = RowAccess & { canChangeState: boolean; canAllocate: boolean };
