import {
  createCustomer,
  createEntityType,
  createFieldDefinition,
  type ExecuteContext,
  execute,
} from "../src/index";
import { unwrap } from "./helpers";

export type TypedBaseInput = {
  context: ExecuteContext;
  base: "CUSTOMER" | "CONTACT" | "TICKET" | "PROGRAM_ITEM" | "REQUIREMENT";
  name: string;
};

/** A type of the base with one TEXT field; returns the type and the field. */
export async function createTypeWithField({ context, base, name }: TypedBaseInput) {
  const type = unwrap({
    result: await execute({ operation: createEntityType, input: { base, name }, context }),
  });
  const field = unwrap({
    result: await execute({
      operation: createFieldDefinition,
      input: { entityTypeId: type.id, name: "Reference", kind: "TEXT" },
      context,
    }),
  });
  return { type, key: field.key, fieldId: field.id };
}

export type CreateTestCustomerInput = { context: ExecuteContext; name: string };

/** A customer of a fresh CUSTOMER type without fields. */
export async function createTestCustomer({ context, name }: CreateTestCustomerInput) {
  const type = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "CUSTOMER", name: `Type of ${name}` },
      context,
    }),
  });
  return unwrap({
    result: await execute({
      operation: createCustomer,
      input: { entityTypeId: type.id, name },
      context,
    }),
  });
}
