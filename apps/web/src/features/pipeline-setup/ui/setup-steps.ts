import type { FieldPath } from "react-hook-form";
import type { SetupFormValues } from "./setup-form-schema";

/** The six steps of the guided setup (ADR 0044), in order. */
export const SETUP_STEPS = ["types", "states", "phases", "grid", "preview", "activate"] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

const FIELDS: Record<SetupStep, FieldPath<SetupFormValues>[]> = {
  types: ["itemTypes"],
  states: ["itemTypes"],
  phases: ["phases"],
  grid: ["cells"],
  preview: [],
  activate: [],
};

/** The form names a step edits: Next validates them. */
export const fieldsOfStep = ({ step }: { step: SetupStep }) => FIELDS[step];
