import { conversationOperations } from "./features/conversation/operations";
import { messageOperations } from "./features/message/operations";
import { roomOperations } from "./features/room/operations";
import { skillOperations } from "./features/skill/operations";
import { venueOperations } from "./features/venue/operations";
import type { AnyOperation } from "./operations/types";
import type { EmbedFn } from "./search/embed";
import { createSearchOperation } from "./search/search-operation";

export type CreateCoreOperationsInput = { embed: EmbedFn };

/** Every operation core ships; adapters register this list so surfaces stay in parity. */
export function createCoreOperations({ embed }: CreateCoreOperationsInput): AnyOperation[] {
  return [
    ...venueOperations,
    ...roomOperations,
    ...conversationOperations,
    ...messageOperations,
    ...skillOperations,
    createSearchOperation({ embed }),
  ];
}
