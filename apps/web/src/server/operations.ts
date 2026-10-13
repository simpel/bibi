import "server-only";
import {
  type AnyOperation,
  AppError,
  createCoreOperations,
  registerOperations,
} from "@okazi/core";
import { embed } from "./embed";

const holder = globalThis as typeof globalThis & { __okaziWebOperations?: AnyOperation[] };

/**
 * Registers core operations (idempotent: same objects) and returns them. Called from
 * `instrumentation.ts` on startup and defensively by every entry point, because Next may
 * bundle route handlers and server components with separate module instances.
 */
export function ensureOperations(): readonly AnyOperation[] {
  holder.__okaziWebOperations ??= createCoreOperations({ embed });
  registerOperations({ operations: holder.__okaziWebOperations });
  return holder.__okaziWebOperations;
}

/** The registered `search` operation (it closes over `embed`, so it is not a static export). */
export function searchOperation(): AnyOperation {
  const operation = ensureOperations().find((candidate) => candidate.name === "search");
  if (!operation) throw new AppError({ code: "INTERNAL", message: "search is not registered" });
  return operation;
}
