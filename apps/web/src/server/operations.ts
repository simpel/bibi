import "server-only";
import {
  type AnyOperation,
  AppError,
  createCoreOperations,
  registerOperations,
  setFileStore,
} from "@bibi/core";
import { getStorage } from "@bibi/storage";
import { embed } from "./embed";

const holder = globalThis as typeof globalThis & { __bibiWebOperations?: AnyOperation[] };

/**
 * Registers core operations (idempotent: same objects) and returns them. Called from
 * `instrumentation.ts` on startup and defensively by every entry point, because Next may
 * bundle route handlers and server components with separate module instances.
 */
export function ensureOperations(): readonly AnyOperation[] {
  if (!holder.__bibiWebOperations) {
    // Core reaches file storage through this port (ADR 0063): `file.upload`, `file.get`.
    setFileStore({ store: getStorage() });
    holder.__bibiWebOperations = createCoreOperations({ embed });
  }
  registerOperations({ operations: holder.__bibiWebOperations });
  return holder.__bibiWebOperations;
}

/** The registered `search` operation (it closes over `embed`, so it is not a static export). */
export function searchOperation(): AnyOperation {
  const operation = ensureOperations().find((candidate) => candidate.name === "search");
  if (!operation) throw new AppError({ code: "INTERNAL", message: "search is not registered" });
  return operation;
}
