import { floorElementKindOperations } from "./kind-operations";
import { getSetupLayout, saveSetupLayout } from "./layout-operations";
import { getFloorPlan, saveFloorPlan } from "./plan-operations";

/** Floor plans, setup layouts and the furniture library (ADR 0099). */
export const floorPlanOperations = [
  ...floorElementKindOperations,
  getFloorPlan,
  saveFloorPlan,
  getSetupLayout,
  saveSetupLayout,
];
