import { z } from "zod";
import { ROUTES } from "@/lib/routes";
import type { IntakeStep } from "./intake-state";

/** The steps with a path segment of their own; step 1 (`who`) is the bare `/new/ticket`. */
export const INTAKE_STEP_SEGMENTS = ["message", "when", "package", "review"] as const;

const StepSegmentSchema = z.enum(INTAKE_STEP_SEGMENTS);

export type StepSegmentsInput = { segments: readonly string[] | undefined };

/**
 * The step a `/new/ticket/[[...step]]` path names: none is `who`, one known segment is that
 * step, anything else is null (not a page).
 */
export function stepFromSegments({ segments }: StepSegmentsInput): IntakeStep | null {
  if (!segments || segments.length === 0) return "who";
  if (segments.length > 1) return null;
  const parsed = StepSegmentSchema.safeParse(segments[0]);
  return parsed.success ? parsed.data : null;
}

/** `/new/ticket` for step 1, `/new/ticket/<step>` for the others. */
export function intakeStepPath({ step }: { step: IntakeStep }): string {
  return step === "who" ? ROUTES.ticketNew : `${ROUTES.ticketNew}/${step}`;
}

const INTAKE_PATH = /\/new\/ticket(?:\/([^/]*))?\/?$/;

/** The step at the end of a pathname (with or without locale and organization), or null. */
export function stepFromPathname({ pathname }: { pathname: string }): IntakeStep | null {
  const match = INTAKE_PATH.exec(pathname);
  if (!match) return null;
  return stepFromSegments({ segments: match[1] ? [match[1]] : [] });
}

export type WithStepInput = { pathname: string; step: IntakeStep };

/** The same pathname (locale and organization kept) with its intake step replaced. */
export function withStepPath({ pathname, step }: WithStepInput): string {
  if (!INTAKE_PATH.test(pathname)) return pathname;
  const base = pathname.replace(INTAKE_PATH, "");
  return `${base}${intakeStepPath({ step })}`;
}
