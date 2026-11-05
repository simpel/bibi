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

/**
 * Held on `globalThis`, not in a module variable: Next can load core as several module
 * instances, and the one running the handler must see the store the app set in another
 * (same pattern as `extract` in order-draft).
 */
const port = globalThis as typeof globalThis & { __bibiFileStore?: FileStore | undefined };

export type SetFileStoreInput = { store: FileStore | undefined };

/** Sets the process-wide store; `undefined` unsets it (file operations then return UNAVAILABLE). */
export function setFileStore({ store }: SetFileStoreInput): void {
  port.__bibiFileStore = store;
}

export function getFileStore(): FileStore | undefined {
  return port.__bibiFileStore;
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
