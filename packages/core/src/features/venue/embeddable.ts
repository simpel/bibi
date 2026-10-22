import type { Venue } from "@bibi/db";
import type { Embeddable } from "../../search/embeddable";

export const venueEmbeddable: Embeddable<Venue> = {
  entityType: "venue",
  isRecord: false,
  readPermission: "venue:read",
  toText: ({ entity }) =>
    [entity.name, entity.description, entity.streetAddress, entity.postalCode, entity.city]
      .filter(Boolean)
      .join("\n"),
  load: ({ ids, db }) => db.venue.findMany({ where: { id: { in: [...ids] } } }),
};
