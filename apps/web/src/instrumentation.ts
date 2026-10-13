import { ensureOperations } from "@/server/operations";

/** Next calls this once when the server starts: register core operations. */
export function register(): void {
  ensureOperations();
}
