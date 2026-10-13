import { RoomSchema, SearchHitSchema, VenueSchema } from "@okazi/core";
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  RoomWireSchema,
  SearchHitWireSchema,
  VenueWireSchema,
} from "../src/ui-contract/wire-schemas";

const keys = ({ schema }: { schema: z.ZodObject }) => Object.keys(schema.shape).sort();

/**
 * The client-safe wire schemas mirror core's output schemas by hand (core's barrel pulls in
 * Prisma). This guard fails when a core field is added/removed without updating the mirror.
 */
describe("wire schemas mirror core output schemas", () => {
  it.each([
    ["venue", VenueSchema, VenueWireSchema],
    ["room", RoomSchema, RoomWireSchema],
    ["search hit", SearchHitSchema, SearchHitWireSchema],
  ] as const)("%s has the same fields", (_name, core, wire) => {
    expect(keys({ schema: wire })).toEqual(keys({ schema: core }));
  });
});
