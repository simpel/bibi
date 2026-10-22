import {
  freeUnits,
  type PoolFreeUnits,
  PoolFreeUnitsOutputSchema,
  type PoolUnit,
  PoolUnitSchema,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

const PoolUnitRef = objectFromSchema<PoolUnit>({
  name: "PoolUnit",
  schema: PoolUnitSchema,
  description: "One unit of a pool: an item.",
});

const PoolFreeUnitsRef = objectFromSchema<PoolFreeUnits>({
  name: "PoolFreeUnits",
  schema: PoolFreeUnitsOutputSchema,
  omit: ["items"],
  description: "The free units of a target for a window, in pool order, with the prepick.",
});

builder.objectField(PoolFreeUnitsRef, "items", (t) =>
  t.field({
    type: [PoolUnitRef],
    description: PoolFreeUnitsOutputSchema.shape.items.description,
    resolve: (page) => page.items,
  }),
);

fieldFromOperation({ operation: freeUnits, type: PoolFreeUnitsRef });
