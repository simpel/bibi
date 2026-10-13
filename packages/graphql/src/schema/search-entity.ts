import type { RoomDto, VenueDto } from "@okazi/core";
import { RoomRef } from "../features/room/graphql";
import { VenueRef } from "../features/venue/graphql";
import { builder, type ObjectRefOf } from "./builder";
import type { GraphqlContext } from "./context";

type Entity = VenueDto | RoomDto;
type EntityType = "venue" | "room";

const refByEntity = new WeakMap<object, ObjectRefOf<never>>();

function tag<T extends Entity>({ row, ref }: { row: T | null; ref: ObjectRefOf<T> }): T | null {
  if (row) refByEntity.set(row, ref as ObjectRefOf<never>);
  return row;
}

/** Entity types that search can return. Add a line here when a new entity becomes embeddable. */
const LOADERS: Record<EntityType, (args: { id: string; ctx: GraphqlContext }) => Promise<Entity | null>> =
  {
    venue: async ({ id, ctx }) =>
      tag({ row: await ctx.core.db.venue.findFirst({ where: { id } }), ref: VenueRef }),
    room: async ({ id, ctx }) =>
      tag({ row: await ctx.core.db.room.findFirst({ where: { id } }), ref: RoomRef }),
  };

export const SearchEntityRef = builder.unionType("SearchEntity", {
  description: "The entity behind a search hit.",
  types: [VenueRef, RoomRef],
  resolveType: (entity) => refByEntity.get(entity) as ObjectRefOf<never>,
});

export type LoadSearchEntityInput = { entityType: string; entityId: string; ctx: GraphqlContext };

/** Loads through the org-scoped client; unknown types and archived rows resolve to null. */
export async function loadSearchEntity({
  entityType,
  entityId,
  ctx,
}: LoadSearchEntityInput): Promise<Entity | null> {
  const load = LOADERS[entityType as EntityType];
  return load ? load({ id: entityId, ctx }) : null;
}
