import { configurationOperations } from "./features/configuration/operations";
import { contactOperations } from "./features/contact/operations";
import { conversationOperations } from "./features/conversation/operations";
import { customerOperations } from "./features/customer/operations";
import { entityTypeOperations } from "./features/entity-type/operations";
import { fieldDefinitionOperations } from "./features/field-definition/operations";
import { itemOperations } from "./features/item/operations";
import { memberOperations } from "./features/member/operations";
import { messageOperations } from "./features/message/operations";
import { roleOperations } from "./features/role/operations";
import { setupOperations } from "./features/setup/operations";
import { skillOperations } from "./features/skill/operations";
import { venueOperations } from "./features/venue/operations";
import { vocabularyOperations } from "./features/vocabulary/operations";
import type { AnyOperation } from "./operations/types";
import type { EmbedFn } from "./search/embed";
import { createSearchOperation } from "./search/search-operation";

export type CreateCoreOperationsInput = { embed: EmbedFn };

/** Every operation core ships; adapters register this list so surfaces stay in parity. */
export function createCoreOperations({ embed }: CreateCoreOperationsInput): AnyOperation[] {
  return [
    ...venueOperations,
    ...entityTypeOperations,
    ...fieldDefinitionOperations,
    ...vocabularyOperations,
    ...setupOperations,
    ...configurationOperations,
    ...itemOperations,
    ...customerOperations,
    ...contactOperations,
    ...conversationOperations,
    ...messageOperations,
    ...skillOperations,
    ...roleOperations,
    ...memberOperations,
    createSearchOperation({ embed }),
  ];
}
