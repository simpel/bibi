import {
  getPhaseGrid,
  importPhaseGridTemplate,
  type PhaseGridCellDto,
  PhaseGridCellSchema,
  type PhaseGridDto,
  type PhaseGridImportTemplateOutput,
  setPhaseGridCell,
} from "@bibi/core";
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

export const PhaseGridRef = builder.objectRef<PhaseGridDto>("PhaseGrid");
PhaseGridRef.implement({
  description: "The phase grid: phases × item types, only the cells that are set.",
  fields: (t) => ({
    cells: t.field({ type: [PhaseGridCellRef], resolve: (grid) => grid.cells }),
  }),
});

const PhaseGridImportRef = builder.objectRef<PhaseGridImportTemplateOutput>("PhaseGridImport");
PhaseGridImportRef.implement({
  description: "Result of importing a phase grid template.",
  fields: (t) => ({
    applied: t.int({
      description: "Cells set by this import; cells that were already set are kept.",
      resolve: (result) => result.applied,
    }),
    grid: t.field({ type: PhaseGridRef, resolve: (result) => result.grid }),
  }),
});

fieldFromOperation({ operation: getPhaseGrid, type: PhaseGridRef, name: "phaseGrid" });
mutationFromOperation({ operation: setPhaseGridCell, type: PhaseGridRef });
mutationFromOperation({ operation: importPhaseGridTemplate, type: PhaseGridImportRef });

builder.objectFields(PhaseGridCellRef, (t) => ({
  phase: t.field({
    type: TicketPhaseRef,
    description: "The phase the cell applies to.",
    resolve: (cell, _args, ctx) => {
      requirePermission({ ctx, permission: "pipeline:read" });
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
      requirePermission({ ctx, permission: "pipeline:read" });
      return ctx.loaders.itemState.load({ id: cell.stateId }) as never;
    },
  }),
}));
