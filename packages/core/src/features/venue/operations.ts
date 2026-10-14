import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { paginate } from "../../shared/paginate";
import { venueEmbeddable } from "./embeddable";
import {
  VenueCreateInputSchema,
  VenueIdInputSchema,
  VenueListInputSchema,
  VenueListOutputSchema,
  VenueSchema,
  VenueUpdateInputSchema,
} from "./schema";

const notFound = () =>
  err({ error: new AppError({ code: "NOT_FOUND", message: "Venue not found" }) });

export const listVenues = defineOperation({
  name: "venue.list",
  kind: "query",
  description: "List active venues of the organization, ordered by name.",
  input: VenueListInputSchema,
  output: VenueListOutputSchema,
  permission: "venue:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.venue.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
    return ok({ value: paginate({ rows, limit: input.limit }) });
  },
});

export const getVenue = defineOperation({
  name: "venue.get",
  kind: "query",
  description: "Get one venue by id.",
  input: VenueIdInputSchema,
  output: VenueSchema,
  permission: "venue:read",
  handler: async ({ input, context }) => {
    const venue = await context.db.venue.findFirst({ where: { id: input.id } });
    return venue ? ok({ value: venue }) : notFound();
  },
});

export const createVenue = defineOperation({
  name: "venue.create",
  kind: "command",
  description:
    "Create a venue (a building or site that bookable items, such as rooms, can belong to).",
  input: VenueCreateInputSchema,
  output: VenueSchema,
  permission: "venue:write",
  embeddable: venueEmbeddable,
  handler: async ({ input, context }) => {
    const venue = await context.db.venue.create({
      data: { ...input, organizationId: context.organizationId, createdBy: context.actor.userId },
    });
    context.recordChange({ entityId: venue.id, after: venue });
    return ok({ value: venue });
  },
});

export const updateVenue = defineOperation({
  name: "venue.update",
  kind: "command",
  description: "Update fields of an active venue. Omitted fields are left unchanged.",
  input: VenueUpdateInputSchema,
  output: VenueSchema,
  permission: "venue:write",
  embeddable: venueEmbeddable,
  handler: async ({ input: { id, ...data }, context }) => {
    const before = await context.db.venue.findFirst({ where: { id } });
    if (!before) return notFound();
    const venue = await context.db.venue.update({ where: { id }, data });
    context.recordChange({ entityId: id, before, after: venue });
    return ok({ value: venue });
  },
});

export const archiveVenue = defineOperation({
  name: "venue.archive",
  kind: "command",
  description:
    "Archive (soft-delete) a venue and every item that belongs to it. Archived rows are hidden.",
  input: VenueIdInputSchema,
  output: VenueSchema,
  permission: "venue:write",
  embeddable: venueEmbeddable,
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.venue.findFirst({ where: { id } });
    if (!before) return notFound();
    const venue = await context.db.venue.update({ where: { id }, data: { status: "ARCHIVED" } });
    const items = await context.db.item.findMany({ where: { venueId: id }, select: { id: true } });
    const itemIds = items.map((item) => item.id);
    await context.db.item.updateMany({
      where: { id: { in: itemIds } },
      data: { status: "ARCHIVED" },
    });
    await context.db.embedding.deleteMany({
      where: { entityType: "item", entityId: { in: itemIds } },
    });
    context.recordChange({ entityId: id, before, after: venue });
    for (const entityId of itemIds) {
      context.recordChange({ entityType: "item", entityId, after: { status: "ARCHIVED" } });
    }
    return ok({ value: venue });
  },
});

export const venueOperations = [listVenues, getVenue, createVenue, updateVenue, archiveVenue];
