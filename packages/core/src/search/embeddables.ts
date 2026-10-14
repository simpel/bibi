import { conversationEmbeddable } from "../features/conversation/embeddable";
import { roomEmbeddable } from "../features/room/embeddable";
import { skillEmbeddable } from "../features/skill/embeddable";
import { venueEmbeddable } from "../features/venue/embeddable";
import type { Embeddable } from "./embeddable";

/**
 * Entity types `search` may return. A hit whose type is not listed here, or whose entity the
 * caller may not see (`load` with `viewer`), is dropped: search fails closed.
 */
export const SEARCHABLE_ENTITIES: readonly Embeddable[] = [
  venueEmbeddable,
  roomEmbeddable,
  conversationEmbeddable,
  skillEmbeddable,
];
