import type { Err } from "../errors/result";

export type RollbackInput = { result: Err };

/** Thrown inside a transaction to roll it back while carrying the failed Result out. */
export class Rollback extends Error {
  readonly result: Err;

  constructor({ result }: RollbackInput) {
    super("rollback");
    this.name = "Rollback";
    this.result = result;
  }
}
