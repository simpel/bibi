import "server-only";
import { createAppExtract } from "@bibi/ai/extract";
import {
  type AnyOperation,
  AppError,
  createCoreOperations,
  registerOperations,
  setExtract,
  setFileStore,
} from "@bibi/core";
import { getStorage } from "@bibi/storage";
import { embed } from "./embed";

const holder = globalThis as typeof globalThis & {
  __bibiWebOperations?: AnyOperation[];
  __bibiWebExtract?: ReturnType<typeof createAppExtract>;
};

/**
 * Registers core operations (idempotent: same objects) and returns them. Called from
 * `instrumentation.ts` on startup and defensively by every entry point, because Next may
 * bundle route handlers and server components with separate module instances.
 */
export function ensureOperations(): readonly AnyOperation[] {
  // Core reaches file storage through this port (ADR 0063): `file.upload`, `file.get`.
  setFileStore({ store: getStorage() });
  // `orderDraft.fromMessage` reads text through this port (ADR 0084).
  // Built once per process; the setters stay per call because each bundle may hold its own core.
  holder.__bibiWebExtract ??= createAppExtract();
  setExtract({ extract: holder.__bibiWebExtract });
  if (!holder.__bibiWebOperations) {
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
