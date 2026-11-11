import { floorElementKindOperations } from "./kind-operations";
import { archiveLayout, createLayout, getLayout, saveLayout } from "./layout-operations";
import { getFloorPlan, saveFloorPlan } from "./plan-operations";

/** Floor plans, layouts and the furniture library (ADR 0099, 0102, 0103). */
export const floorPlanOperations = [
  ...floorElementKindOperations,
  getFloorPlan,
  saveFloorPlan,
  getLayout,
  createLayout,
  saveLayout,
  archiveLayout,
];
