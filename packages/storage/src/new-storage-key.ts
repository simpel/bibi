import { randomUUID } from "node:crypto";

export type NewStorageKeyInput = { ownerId: string };

/** A random key scoped by its owner: `<ownerId>/<uuid>`. */
export function newStorageKey({ ownerId }: NewStorageKeyInput): string {
  return `${ownerId}/${randomUUID()}`;
}
