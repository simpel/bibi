import {
  createRequirement,
  createVocabulary,
  type ExecuteContext,
  execute,
  type RequirementCreateInput,
} from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { unwrap } from "./helpers";
import { addProgramItem, programSetup } from "./program-item-helpers";

/**
 * A booking with two program items (09–10 and 12–13), a requirement type with one TEXT field and
 * the list Allergens with Gluten and Lactose.
 */
export async function requirementSetup() {
  const { context, booking, type: programType } = await programSetup();
  const base = { context, bookingId: booking.id, entityTypeId: programType.id };
  const morning = unwrap({ result: await addProgramItem({ ...base, from: 9, to: 10 }) });
  const lunch = unwrap({ result: await addProgramItem({ ...base, from: 12, to: 13 }) });
  const { type, key } = await createTypeWithField({
    context,
    base: "REQUIREMENT",
    name: "Allergy",
  });
  const list = unwrap({
    result: await execute({
      operation: createVocabulary,
      input: { name: "Allergens", values: ["Gluten", "Lactose"] },
      context,
    }),
  });
  const [gluten, lactose] = list.values.map((value) => value.id) as [string, string];
  return { context, booking, morning, lunch, type, key, list, gluten, lactose };
}

export type AddRequirementInput = { context: ExecuteContext } & RequirementCreateInput;

/** Runs `requirement.create` and returns the result. */
export const addRequirement = ({ context, ...input }: AddRequirementInput) =>
  execute({ operation: createRequirement, input, context });
