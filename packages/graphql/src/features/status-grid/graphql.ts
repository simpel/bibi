import {
  getStatusGrid,
  importStatusGridTemplate,
  type StatusGridCellDto,
  StatusGridCellSchema,
  type StatusGridDto,
  type StatusGridImportTemplateOutput,
  setStatusGridCell,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { requirePermission } from "../../schema/require-permission";
import { EntityTypeRef } from "../entity-type/graphql";
import { ItemStateRef } from "../item-state/graphql";
import { TicketStatusRef } from "../ticket-status/graphql";

export const StatusGridCellRef = objectFromSchema<StatusGridCellDto>({
  name: "StatusGridCell",
  schema: StatusGridCellSchema,
  omit: ["organizationId"],
  description:
    "One set cell of the status grid (ADR 0044): entering the status moves the ticket's lines of " +
    "the item type to the state. A missing cell means the lines keep their state.",
});

export const StatusGridRef = builder.objectRef<StatusGridDto>("StatusGrid");
StatusGridRef.implement({
  description: "The status grid: statuses × item types, only the cells that are set.",
  fields: (t) => ({
    cells: t.field({ type: [StatusGridCellRef], resolve: (grid) => grid.cells }),
  }),
});

const StatusGridImportRef = builder.objectRef<StatusGridImportTemplateOutput>("StatusGridImport");
StatusGridImportRef.implement({
  description: "Result of importing a status grid template.",
  fields: (t) => ({
    applied: t.int({
      description: "Cells set by this import; cells that were already set are kept.",
      resolve: (result) => result.applied,
    }),
    grid: t.field({ type: StatusGridRef, resolve: (result) => result.grid }),
  }),
});

fieldFromOperation({ operation: getStatusGrid, type: StatusGridRef, name: "statusGrid" });
mutationFromOperation({ operation: setStatusGridCell, type: StatusGridRef });
mutationFromOperation({ operation: importStatusGridTemplate, type: StatusGridImportRef });

builder.objectFields(StatusGridCellRef, (t) => ({
  ticketStatus: t.field({
    type: TicketStatusRef,
    description: "The status the cell applies to.",
    resolve: (cell, _args, ctx) => {
      requirePermission({ ctx, permission: "pipeline:read" });
      return ctx.loaders.ticketStatus.load({ id: cell.statusId }) as never;
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
