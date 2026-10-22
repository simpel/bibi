import {
  type ContactDto,
  type ConversationDto,
  type CustomerDto,
  getContact,
  getConversation,
  getCustomer,
  getItem,
  getSkill,
  type ItemDto,
  type SkillDto,
  type VenueDto,
} from "@bibi/core";
import { ContactRef } from "../features/contact/graphql";
import { ConversationRef } from "../features/conversation/graphql";
import { CustomerRef } from "../features/customer/graphql";
import { ItemRef } from "../features/item/graphql";
import { SkillRef } from "../features/skill/graphql";
import { VenueRef } from "../features/venue/graphql";
import { builder, type ObjectRefOf } from "./builder";
import type { GraphqlContext } from "./context";
import { runOperation } from "./run-operation";

type Entity = VenueDto | ItemDto | CustomerDto | ContactDto | ConversationDto | SkillDto;
type EntityType = "venue" | "item" | "customer" | "contact" | "conversation" | "skill";

const refByEntity = new WeakMap<object, ObjectRefOf<never>>();

function tag<T extends Entity>({ row, ref }: { row: T | null; ref: ObjectRefOf<T> }): T | null {
  if (row) refByEntity.set(row, ref as ObjectRefOf<never>);
  return row;
}

type LoadInput = { id: string; ctx: GraphqlContext };

/** Per-user visibility lives in core, so private entities load through their `get` operation. */
async function viaGet<T extends Entity>({
  operation,
  id,
  ctx,
}: LoadInput & {
  operation:
    | typeof getConversation
    | typeof getSkill
    | typeof getItem
    | typeof getCustomer
    | typeof getContact;
}): Promise<T | null> {
  try {
    return (await runOperation({ operation, input: { id }, ctx })) as T;
  } catch {
    return null;
  }
}

/** Entity types that search can return. Add a line here when a new entity becomes embeddable. */
const LOADERS: Record<EntityType, (args: LoadInput) => Promise<Entity | null>> = {
  venue: async ({ id, ctx }) => tag({ row: await ctx.loaders.venue.load({ id }), ref: VenueRef }),
  item: async ({ id, ctx }) =>
    tag({ row: await viaGet<ItemDto>({ operation: getItem, id, ctx }), ref: ItemRef }),
  customer: async ({ id, ctx }) =>
    tag({
      row: await viaGet<CustomerDto>({ operation: getCustomer, id, ctx }),
      ref: CustomerRef,
    }),
  contact: async ({ id, ctx }) =>
    tag({ row: await viaGet<ContactDto>({ operation: getContact, id, ctx }), ref: ContactRef }),
  conversation: async ({ id, ctx }) =>
    tag({
      row: await viaGet<ConversationDto>({ operation: getConversation, id, ctx }),
      ref: ConversationRef,
    }),
  skill: async ({ id, ctx }) =>
    tag({ row: await viaGet<SkillDto>({ operation: getSkill, id, ctx }), ref: SkillRef }),
};

export const SearchEntityRef = builder.unionType("SearchEntity", {
  description: "The entity behind a search hit.",
  types: [VenueRef, ItemRef, CustomerRef, ContactRef, ConversationRef, SkillRef],
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
