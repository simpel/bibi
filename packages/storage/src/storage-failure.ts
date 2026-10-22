import { appError, type Err, err } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import type { StorageProviderName } from "./storage-provider";

export type StorageFailureInput = {
  provider: StorageProviderName;
  operation: "put" | "get" | "delete";
  cause: unknown;
};

/** Logs `storage.failed` (never the key or body) and returns an `UNAVAILABLE` error. */
export function storageFailure({ provider, operation, cause }: StorageFailureInput): Err {
  const error = appError({ code: "UNAVAILABLE", message: `Storage ${operation} failed`, cause });
  getLogger().error({ event: "storage.failed", provider, operation, err: error });
  return err({ error });
}
