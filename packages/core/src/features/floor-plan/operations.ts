import { floorElementKindOperations } from "./kind-operations";
import {
  archiveSetupLayout,
  createSetupLayout,
  getSetupLayout,
  saveSetupLayout,
} from "./layout-operations";
import { getFloorPlan, saveFloorPlan } from "./plan-operations";

/** Floor plans, setup layouts and the furniture library (ADR 0099, 0102). */
export const floorPlanOperations = [
  ...floorElementKindOperations,
  getFloorPlan,
  saveFloorPlan,
  getSetupLayout,
  createSetupLayout,
  saveSetupLayout,
  archiveSetupLayout,
];
