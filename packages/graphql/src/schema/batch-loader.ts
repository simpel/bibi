export type BatchLoader<V> = { load: (input: { id: string }) => Promise<V | null> };

export type CreateBatchLoaderInput<V> = {
  /** Fetches all ids in one go; ids that are missing (or archived) are left out of the map. */
  batch: (ids: readonly string[]) => Promise<ReadonlyMap<string, V>>;
};

/**
 * Per-request loader: ids requested in the same tick are fetched with one `batch` call and each
 * id is fetched at most once. Dependency-free stand-in for the `dataloader` package.
 */
export function createBatchLoader<V>({ batch }: CreateBatchLoaderInput<V>): BatchLoader<V> {
  const cache = new Map<string, Promise<V | null>>();
  let pending = new Map<string, (value: V | null) => void>();
  let rejectAll: ((error: unknown) => void)[] = [];

  function flush(): void {
    const current = pending;
    const rejecters = rejectAll;
    pending = new Map();
    rejectAll = [];
    batch([...current.keys()]).then(
      (found) => {
        for (const [id, resolve] of current) resolve(found.get(id) ?? null);
      },
      (error: unknown) => {
        for (const id of current.keys()) cache.delete(id);
        for (const reject of rejecters) reject(error);
      },
    );
  }

  function load({ id }: { id: string }): Promise<V | null> {
    const hit = cache.get(id);
    if (hit) return hit;
    const promise = new Promise<V | null>((resolve, reject) => {
      if (pending.size === 0) queueMicrotask(flush);
      pending.set(id, resolve);
      rejectAll.push(reject);
    });
    cache.set(id, promise);
    return promise;
  }

  return { load };
}
