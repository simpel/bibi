import type { Result } from "@bibi/core";

export type StorageProviderName = "disk" | "s3";

export type PutInput = { key: string; body: Uint8Array; contentType: string };

export type GetInput = { key: string };

export type DeleteInput = { key: string };

export type GetResult = Result<StoredFile | null>;

export type KeyResult = Result<{ key: string }>;

export type StoredFile = { body: Uint8Array; contentType: string };

/**
 * The one seam to file storage (ADR 0063). Adapters: `disk` (dev and tests) and `s3` (any
 * S3-compatible service). `get` resolves to `null` when the key does not exist; `delete` of a
 * missing key succeeds.
 */
export type StorageProvider = {
  readonly name: StorageProviderName;
  put(input: PutInput): Promise<KeyResult>;
  get(input: GetInput): Promise<GetResult>;
  delete(input: DeleteInput): Promise<KeyResult>;
};
