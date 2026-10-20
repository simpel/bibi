import type { Conversation } from "@okazi/db";
import type { Embeddable } from "../../search/embeddable";

/** Titles are searchable, but only by the owner (search passes `viewer`). */
export const conversationEmbeddable: Embeddable<Conversation> = {
  entityType: "conversation",
  isRecord: false,
  toText: ({ entity }) => entity.title,
  load: ({ ids, db, viewer }) =>
    db.conversation.findMany({
      where: { id: { in: [...ids] }, ...(viewer ? { ownerUserId: viewer.userId ?? "" } : {}) },
    }),
};
