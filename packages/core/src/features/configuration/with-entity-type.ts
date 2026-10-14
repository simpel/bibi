import type { OperationContext } from "../../operations/types";

export type WithEntityTypeInput = { context: OperationContext; entityType: string };

/** The context with audit rows tagged as `entityType`, for commands that create several kinds. */
export const withEntityType = ({ context, entityType }: WithEntityTypeInput): OperationContext => ({
  ...context,
  recordChange: (change) => context.recordChange({ entityType, ...change }),
});
