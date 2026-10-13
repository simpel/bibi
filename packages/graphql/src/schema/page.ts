import { builder, type ObjectRefOf } from "./builder";

export type Page<T> = { items: T[]; nextCursor: string | null };
export type PageTypeInput<T> = { name: string; item: ObjectRefOf<T> };

/** `{ items, nextCursor }` list type matching core's `paginate`. */
export function pageType<T>({ name, item }: PageTypeInput<T>): ObjectRefOf<Page<T>> {
  return builder.objectRef<Page<T>>(name).implement({
    description: "One page of results; pass `nextCursor` as `cursor` to get the next page.",
    fields: (t) => ({
      items: t.field({ type: [item], resolve: (page) => page.items }),
      nextCursor: t.string({ nullable: true, resolve: (page) => page.nextCursor }),
    }),
  });
}
