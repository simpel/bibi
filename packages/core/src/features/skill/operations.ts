import { archiveSkill, publishSkill } from "./lifecycle-operations";
import { exportSkill, getSkill, listSkills } from "./read-operations";
import { importSkill, shareSkill } from "./transfer-operations";
import { createSkill, updateSkill } from "./write-operations";

/** Every skill operation; the implementations live in the sibling `*-operations.ts` files. */
export const skillOperations = [
  listSkills,
  getSkill,
  exportSkill,
  createSkill,
  updateSkill,
  publishSkill,
  archiveSkill,
  shareSkill,
  importSkill,
];
