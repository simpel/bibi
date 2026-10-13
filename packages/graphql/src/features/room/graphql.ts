import {
  archiveRoom,
  createRoom,
  getRoom,
  listRooms,
  type RoomDto,
  RoomSchema,
  updateRoom,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { VenueRef } from "../venue/graphql";

export const RoomRef = objectFromSchema<RoomDto>({
  name: "Room",
  schema: RoomSchema,
  omit: ["organizationId"],
  description: "Rum – a bookable room inside a venue.",
});
const RoomPageRef = pageType({ name: "RoomPage", item: RoomRef });

fieldFromOperation({ operation: listRooms, type: RoomPageRef, name: "rooms" });
fieldFromOperation({ operation: getRoom, type: RoomRef, name: "room" });
mutationFromOperation({ operation: createRoom, type: RoomRef });
mutationFromOperation({ operation: updateRoom, type: RoomRef });
mutationFromOperation({ operation: archiveRoom, type: RoomRef });

// Graph edges. They read through the org-scoped `ctx.core.db`, so scoping cannot be bypassed.
// Both live here so that venue/graphql.ts does not need to import room/graphql.ts.
builder.objectField(VenueRef, "rooms", (t) =>
  t.field({
    type: [RoomRef],
    description: "Active rooms of the venue, ordered by name.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: (venue, { limit }, ctx) => {
      requirePermission({ ctx, permission: "room:read" });
      return ctx.core.db.room.findMany({
        where: { venueId: venue.id },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        take: Math.min(Math.max(limit ?? 50, 1), 100),
      });
    },
  }),
);

builder.objectField(RoomRef, "venue", (t) =>
  t.field({
    type: VenueRef,
    nullable: true,
    description: "The venue the room belongs to (null if the venue is archived).",
    resolve: (room, _args, ctx) => {
      requirePermission({ ctx, permission: "venue:read" });
      return ctx.core.db.venue.findFirst({ where: { id: room.venueId } });
    },
  }),
);
