import { ok, type Result } from "../../errors/result";

export type StoredFileBody = { body: Uint8Array; contentType: string };

/**
 * The file storage port core needs (ADR 0063). `@bibi/storage`'s `StorageProvider` satisfies it;
 * core cannot depend on that package (it depends on core), so apps inject it at startup with
 * `setFileStore({ store: getStorage() })`, like `embed`.
 */
export type FileStore = {
  put(input: { key: string; body: Uint8Array; contentType: string }): Promise<Result<unknown>>;
  get(input: { key: string }): Promise<Result<StoredFileBody | null>>;
};

let current: FileStore | undefined;

export type SetFileStoreInput = { store: FileStore | undefined };

/** Sets the process-wide store; `undefined` unsets it (file operations then return UNAVAILABLE). */
export function setFileStore({ store }: SetFileStoreInput): void {
  current = store;
}

export function getFileStore(): FileStore | undefined {
  return current;
}

/** In-memory stand-in for tests (like `createMemoryPaymentProvider`). */
export function createMemoryFileStore(): FileStore {
  const files = new Map<string, StoredFileBody>();
  return {
    put: async ({ key, body, contentType }) => {
      files.set(key, { body, contentType });
      return ok({ value: { key } });
    },
    get: async ({ key }) => ok({ value: files.get(key) ?? null }),
  };
}
