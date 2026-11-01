import type { OperationContext } from "../operations/types";

export type NowOfInput = { context: Pick<OperationContext, "now"> };

/** The context's instant (`OperationContext.now`), else real time (ADR 0064). */
export const nowOf = ({ context }: NowOfInput): Date => context.now?.() ?? new Date();
