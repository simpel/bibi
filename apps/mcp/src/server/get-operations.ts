import { type AnyOperation, createCoreOperations, type EmbedFn } from "@bibi/core";

const cache = new WeakMap<EmbedFn, AnyOperation[]>();

export type GetOperationsInput = { embed: EmbedFn };

/** Core operations for this `embed`; memoized because the search operation closes over it. */
export function getOperations({ embed }: GetOperationsInput): AnyOperation[] {
  let operations = cache.get(embed);
  if (!operations) {
    operations = createCoreOperations({ embed });
    cache.set(embed, operations);
  }
  return operations;
}
