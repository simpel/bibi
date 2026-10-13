import { ensureOperations } from "@/server/operations";

/** Registers core operations on server startup (Node runtime only). */
export function registerCoreOperations(): void {
  ensureOperations();
}
