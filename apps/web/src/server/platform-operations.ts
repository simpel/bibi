import "server-only";
import {
  createEmbeddingProbe,
  createListCompatibleModels,
  createListGatewayModels,
} from "@okazi/ai";
import { createPlatformOperations, type PlatformOperations } from "@okazi/core";

// Module-level (not globalThis): rebuilt when this module reloads, so dev never runs stale ops.
let operations: PlatformOperations | undefined;

/**
 * Platform operations (ADR 0015). Model lists come from the Vercel AI Gateway, filtered to what
 * each AI feature can use (tags; embedding dimensions by probe). Web-only.
 */
export function platformOperations(): PlatformOperations {
  operations ??= createPlatformOperations({
    listCompatibleModels: createListCompatibleModels({
      listModels: createListGatewayModels(),
      probeEmbedding: createEmbeddingProbe(),
    }),
  });
  return operations;
}
