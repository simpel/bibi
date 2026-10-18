import {
  getPhaseGrid,
  type PhaseGridCellDto,
  PhaseGridCellSchema,
  type PhaseGridDto,
  setPhaseGridCell,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { requirePermission } from "../../schema/require-permission";
import { EntityTypeRef } from "../entity-type/graphql";
import { ItemStateRef } from "../item-state/graphql";
import { TicketPhaseRef } from "../ticket-phase/graphql";

export const PhaseGridCellRef = objectFromSchema<PhaseGridCellDto>({
  name: "PhaseGridCell",
  schema: PhaseGridCellSchema,
  omit: ["organizationId"],
  description:
    "One set cell of the phase grid (ADR 0044): entering the phase moves the ticket's lines of " +
    "the item type to the state. A missing cell means the lines keep their state.",
});

const PhaseGridRef = builder.objectRef<PhaseGridDto>("PhaseGrid");
PhaseGridRef.implement({
  description: "The phase grid: phases × item types, only the cells that are set.",
  fields: (t) => ({
    cells: t.field({ type: [PhaseGridCellRef], resolve: (grid) => grid.cells }),
  }),
});

fieldFromOperation({ operation: getPhaseGrid, type: PhaseGridRef, name: "phaseGrid" });
mutationFromOperation({ operation: setPhaseGridCell, type: PhaseGridRef });

builder.objectFields(PhaseGridCellRef, (t) => ({
  phase: t.field({
    type: TicketPhaseRef,
    description: "The phase the cell applies to.",
    resolve: (cell, _args, ctx) => {
      requirePermission({ ctx, permission: "ticketPhase:read" });
      return ctx.loaders.ticketPhase.load({ id: cell.phaseId }) as never;
    },
  }),
  entityType: t.field({
    type: EntityTypeRef,
    description: "The item type the cell applies to.",
    resolve: (cell, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.entityType.load({ id: cell.entityTypeId }) as never;
    },
  }),
  state: t.field({
    type: ItemStateRef,
    description: "The state the lines move to.",
    resolve: (cell, _args, ctx) => {
      requirePermission({ ctx, permission: "itemState:read" });
      return ctx.loaders.itemState.load({ id: cell.stateId }) as never;
    },
  }),
}));
