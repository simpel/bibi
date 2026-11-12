import type { AnyOperation } from "./types";

/** The operation's own transaction timeout, when it declares one (`transactionTimeoutMs`). */
export const transactionOptions = ({ operation }: { operation: AnyOperation }) =>
  operation.transactionTimeoutMs ? { timeout: operation.transactionTimeoutMs } : undefined;
