import type { InputStep, IntakeState } from "./intake-state";

/**
 * The steps whose answer is still what the message said ("from email", spec "The page"): the
 * matched customer and contact, step 2 as read, the suggested package. A changed value loses it.
 */
export function fromEmailSteps({ state }: { state: IntakeState }): InputStep[] {
  const { draft, who, when, pick } = state;
  if (!draft) return [];
  const steps: InputStep[] = [];
  const read = draft.who;
  if (read && who?.customerId === read.customerId && who.contactId === read.contactId) {
    steps.push("who");
  }
  const asRead = draft.when;
  if (
    when &&
    when.date === asRead.date &&
    when.from === asRead.from &&
    when.to === asRead.to &&
    String(when.guests) === asRead.guests
  ) {
    steps.push("when");
  }
  if (pick?.kind === "PACKAGE" && pick.templateId === draft.templateId) steps.push("package");
  return steps;
}
