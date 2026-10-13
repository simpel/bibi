import type { Room, Venue } from "@okazi/db";
import type { Embeddable } from "../../search/embeddable";

type RoomWithVenue = Room & { venue: Pick<Venue, "name" | "city"> };

export const roomEmbeddable: Embeddable<RoomWithVenue> = {
  entityType: "room",
  toText: ({ entity }) =>
    [
      entity.name,
      entity.description,
      entity.maxCapacity ? `max ${entity.maxCapacity} people` : null,
      entity.hasDaylight ? "daylight" : null,
      [entity.venue.name, entity.venue.city].filter(Boolean).join(", "),
    ]
      .filter(Boolean)
      .join("\n"),
  load: ({ ids, db }) =>
    db.room.findMany({
      where: { id: { in: [...ids] } },
      include: { venue: { select: { name: true, city: true } } },
    }),
};
