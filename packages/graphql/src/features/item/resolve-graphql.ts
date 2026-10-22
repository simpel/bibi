import {
  type ItemResolution,
  ItemResolutionSchema,
  type ResolvedItemNode,
  ResolvedItemNodeSchema,
  type ResolvedTag,
  ResolvedTagSchema,
  resolveItem,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

const ResolvedItemNodeRef = objectFromSchema<ResolvedItemNode>({
  name: "ResolvedItemNode",
  schema: ResolvedItemNodeSchema,
  description: "One item in an expanded composition, with its timing and own list values.",
});

const ResolvedTagRef = objectFromSchema<ResolvedTag>({
  name: "ResolvedTag",
  schema: ResolvedTagSchema,
  description: "A list value inherited by a composed item, with the items that carry it.",
});

const ItemResolutionRef = objectFromSchema<ItemResolution>({
  name: "ItemResolution",
  schema: ItemResolutionSchema,
  omit: ["nodes", "contains", "mayContain"],
  description: "An item expanded into its parts at every level, with inherited list values.",
});

builder.objectFields(ItemResolutionRef, (t) => ({
  nodes: t.field({
    type: [ResolvedItemNodeRef],
    description: ItemResolutionSchema.shape.nodes.description,
    resolve: (resolution) => resolution.nodes,
  }),
  contains: t.field({
    type: [ResolvedTagRef],
    description: ItemResolutionSchema.shape.contains.description,
    resolve: (resolution) => resolution.contains,
  }),
  mayContain: t.field({
    type: [ResolvedTagRef],
    description: ItemResolutionSchema.shape.mayContain.description,
    resolve: (resolution) => resolution.mayContain,
  }),
}));

fieldFromOperation({ operation: resolveItem, type: ItemResolutionRef, name: "itemResolution" });
