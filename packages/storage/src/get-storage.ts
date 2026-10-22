import { isAbsolute, resolve } from "node:path";
import { type Env, getEnv } from "@bibi/config";
import { createDiskProvider } from "./disk/create-disk-provider";
import { createS3Provider } from "./s3/create-s3-provider";
import type { StorageProvider } from "./storage-provider";

const repoRoot = new URL("../../../", import.meta.url).pathname;

let configured: StorageProvider | undefined;
let override: StorageProvider | undefined;

export type StorageFromEnvInput = { env: Env };

/** The adapter `STORAGE_DRIVER` selects: `disk` (default) or `s3`. */
export function storageFromEnv({ env }: StorageFromEnvInput): StorageProvider {
  if (env.STORAGE_DRIVER === "s3") {
    // `@bibi/config` refuses STORAGE_DRIVER=s3 without the S3_* settings.
    return createS3Provider({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION ?? "",
      bucket: env.S3_BUCKET ?? "",
      accessKeyId: env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? "",
    });
  }
  const dir = env.STORAGE_DISK_DIR;
  return createDiskProvider({ root: isAbsolute(dir) ? dir : resolve(repoRoot, dir) });
}

/** The process-wide provider: a test override if set, otherwise the env-selected adapter. */
export function getStorage(): StorageProvider {
  if (override) return override;
  configured ??= storageFromEnv({ env: getEnv() });
  return configured;
}

export type SetStorageInput = { provider: StorageProvider | undefined };

/** Replaces the env-selected adapter (tests, previews). Pass `undefined` to restore it. */
export function setStorage({ provider }: SetStorageInput): void {
  override = provider;
}
