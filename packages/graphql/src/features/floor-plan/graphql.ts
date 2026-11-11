import {
  archiveFloorElementKind,
  archiveLayout,
  createFloorElementKind,
  createLayout,
  type FloorElementDto,
  type FloorElementKindDto,
  FloorElementKindImportOutputSchema,
  FloorElementKindSchema,
  FloorElementSchema,
  type FloorPlanDto,
  FloorPlanSchema,
  getFloorElementKind,
  getFloorPlan,
  getLayout,
  importFloorElementKinds,
  type LayoutDto,
  LayoutIssueSchema,
  LayoutSchema,
  type LayoutSummaryDto,
  LayoutSummarySchema,
  listFloorElementKinds,
  saveFloorPlan,
  saveLayout,
  updateFloorElementKind,
} from "@bibi/core";
import type { z } from "zod";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

type FloorElementSides = FloorElementDto["effectiveSides"];
type FloorPlanShapeDto = LayoutDto["plan"];
type LayoutIssueDto = LayoutDto["issues"][number];

export const FloorElementKindRef = objectFromSchema<FloorElementKindDto>({
  name: "FloorElementKind",
  schema: FloorElementKindSchema,
  omit: ["organizationId"],
  description:
    "Floor element kind – a library entry (a table, a chair row, a door) with its seats.",
});
const FloorElementKindPageRef = pageType({
  name: "FloorElementKindPage",
  item: FloorElementKindRef,
});
const FloorElementKindImportRef = objectFromSchema<
  z.infer<typeof FloorElementKindImportOutputSchema>
>({
  name: "FloorElementKindImport",
  schema: FloorElementKindImportOutputSchema,
  description: "How many library kinds a template import created and skipped.",
});

const FloorSeatSidesRef = builder.objectRef<FloorElementSides>("FloorSeatSides").implement({
  description: "Chairs per side of a RECT element, after inheritance.",
  fields: (t) => ({
    top: t.exposeInt("top"),
    right: t.exposeInt("right"),
    bottom: t.exposeInt("bottom"),
    left: t.exposeInt("left"),
  }),
});

export const FloorElementRef = objectFromSchema<FloorElementDto>({
  name: "FloorElement",
  schema: FloorElementSchema,
  omit: ["effectiveSides"],
  description: "A placed element: position, own overrides and the effective size and seats.",
});
builder.objectField(FloorElementRef, "effectiveSides", (t) =>
  t.field({
    type: FloorSeatSidesRef,
    description: "RECT: chairs per side after inheritance.",
    resolve: (element) => element.effectiveSides,
  }),
);

export const LayoutSummaryRef = objectFromSchema<LayoutSummaryDto>({
  name: "LayoutSummary",
  schema: LayoutSummarySchema,
  omit: ["elements"],
  description: "One layout of a room: its name, version, seats drawn, capacity and pieces.",
});

builder.objectField(LayoutSummaryRef, "elements", (t) =>
  t.field({
    type: [FloorElementRef],
    description: "The layout's pieces, e.g. for a thumbnail.",
    resolve: (layout) => layout.elements,
  }),
);

export const LayoutIssueRef = objectFromSchema<LayoutIssueDto>({
  name: "LayoutIssue",
  schema: LayoutIssueSchema,
  description:
    "A layout problem: EXIT_BLOCKED and OVER_LIMIT refuse a save, the rest are warnings.",
});

export const FloorPlanRef = objectFromSchema<FloorPlanDto>({
  name: "FloorPlan",
  schema: FloorPlanSchema,
  omit: ["elements", "layouts"],
  description:
    "An item's floor plan: walls (outline as [x, y] points in cm), fixed elements and layouts.",
});
builder.objectField(FloorPlanRef, "elements", (t) =>
  t.field({
    type: [FloorElementRef],
    description: "The fixed elements (doors, pillars).",
    resolve: (plan) => plan.elements,
  }),
);
builder.objectField(FloorPlanRef, "layouts", (t) =>
  t.field({
    type: [LayoutSummaryRef],
    description: "Every layout of the room, by name.",
    resolve: (plan) => plan.layouts,
  }),
);

const FloorPlanShapeRef = objectFromSchema<FloorPlanShapeDto>({
  name: "FloorPlanShape",
  schema: LayoutSchema.shape.plan,
  omit: ["elements"],
  description: "The floor plan a layout sits in.",
});
builder.objectField(FloorPlanShapeRef, "elements", (t) =>
  t.field({
    type: [FloorElementRef],
    description: "The floor plan's fixed elements.",
    resolve: (plan) => plan.elements,
  }),
);

export const LayoutRef = objectFromSchema<LayoutDto>({
  name: "Layout",
  schema: LayoutSchema,
  omit: ["elements", "plan", "issues"],
  description: "One layout of a room: the pieces, seats, capacity and warnings.",
});
builder.objectField(LayoutRef, "elements", (t) =>
  t.field({
    type: [FloorElementRef],
    description: "The layout's pieces.",
    resolve: (layout) => layout.elements,
  }),
);
builder.objectField(LayoutRef, "plan", (t) =>
  t.field({
    type: FloorPlanShapeRef,
    description: "The floor plan with its fixed elements.",
    resolve: (layout) => layout.plan,
  }),
);
builder.objectField(LayoutRef, "issues", (t) =>
  t.field({
    type: [LayoutIssueRef],
    description: "Warnings; they never block a save.",
    resolve: (layout) => layout.issues,
  }),
);

fieldFromOperation({
  operation: listFloorElementKinds,
  type: FloorElementKindPageRef,
  name: "floorElementKinds",
});
fieldFromOperation({
  operation: getFloorElementKind,
  type: FloorElementKindRef,
  name: "floorElementKind",
});
mutationFromOperation({ operation: createFloorElementKind, type: FloorElementKindRef });
mutationFromOperation({ operation: updateFloorElementKind, type: FloorElementKindRef });
mutationFromOperation({ operation: archiveFloorElementKind, type: FloorElementKindRef });
mutationFromOperation({ operation: importFloorElementKinds, type: FloorElementKindImportRef });
fieldFromOperation({ operation: getFloorPlan, type: FloorPlanRef, name: "floorPlan" });
mutationFromOperation({ operation: saveFloorPlan, type: FloorPlanRef });
fieldFromOperation({ operation: getLayout, type: LayoutRef, name: "layout" });
mutationFromOperation({ operation: createLayout, type: LayoutRef });
mutationFromOperation({ operation: saveLayout, type: LayoutRef });
mutationFromOperation({ operation: archiveLayout, type: LayoutRef });
