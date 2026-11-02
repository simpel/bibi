import { builder, type ObjectRefOf } from "./builder";

export type Page<T> = { items: T[]; nextCursor: string | null; total?: number | null };
export type PageTypeInput<T> = {
  name: string;
  item: ObjectRefOf<T>;
  /** Adds `total`, for lists that also page by number (`page`). */
  withTotal?: boolean;
};

/** `{ items, nextCursor }` list type matching core's `paginate`, optionally with `total`. */
export function pageType<T>({ name, item, withTotal }: PageTypeInput<T>): ObjectRefOf<Page<T>> {
  return builder.objectRef<Page<T>>(name).implement({
    description: "One page of results; pass `nextCursor` as `cursor` to get the next page.",
    fields: (t) => ({
      items: t.field({ type: [item], resolve: (page) => page.items }),
      nextCursor: t.string({ nullable: true, resolve: (page) => page.nextCursor }),
      ...(withTotal
        ? {
            total: t.int({
              nullable: true,
              description: "The number of matches; only when paging by `page`.",
              resolve: (page) => page.total ?? null,
            }),
          }
        : {}),
    }),
  });
}
