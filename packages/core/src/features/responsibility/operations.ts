import { getResponsibility, listResponsibilities } from "./read-operations";
import {
  archiveResponsibility,
  createResponsibility,
  updateResponsibility,
} from "./write-operations";

export const responsibilityOperations = [
  listResponsibilities,
  getResponsibility,
  createResponsibility,
  updateResponsibility,
  archiveResponsibility,
];
