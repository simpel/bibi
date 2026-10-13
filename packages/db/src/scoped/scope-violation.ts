export type ScopeViolationInput = {
  model: string | undefined;
  operation: string;
  reason: string;
};

/** Raised when code tries to bypass organization scoping. Mapped to FORBIDDEN by core. */
export class ScopeViolationError extends Error {
  readonly model: string | undefined;
  readonly operation: string;

  constructor({ model, operation, reason }: ScopeViolationInput) {
    super(`Scope violation on ${model ?? "client"}.${operation}: ${reason}`);
    this.name = "ScopeViolationError";
    this.model = model;
    this.operation = operation;
  }
}
