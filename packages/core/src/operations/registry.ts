import { AppError } from "../errors/app-error";
import type { AnyOperation } from "./types";

const operations = new Map<string, AnyOperation>();

export type RegisterOperationsInput = { operations: readonly AnyOperation[] };

/** Registers operations; re-registering the same object is a no-op, a different one is a bug. */
export function registerOperations({ operations: list }: RegisterOperationsInput): void {
  for (const operation of list) {
    const existing = operations.get(operation.name);
    if (existing && existing !== operation) {
      const message = `Operation "${operation.name}" is already registered`;
      throw new AppError({ code: "INTERNAL", message });
    }
    operations.set(operation.name, operation);
  }
}

export function listOperations(): AnyOperation[] {
  return [...operations.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type GetOperationInput = { name: string };

export function getOperation({ name }: GetOperationInput): AnyOperation | undefined {
  return operations.get(name);
}
