import { describe, expect, it } from "vitest";
import {
  archiveRequirement,
  archiveVocabularyValue,
  createVocabulary,
  execute,
  getRequirement,
  listRequirements,
  updateRequirement,
} from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { errorCode, peer, testContext, unwrap } from "./helpers";
import { addRequirement, requirementSetup } from "./requirement-helpers";
import { createTestTicket } from "./ticket-helpers";

describe("requirement (ADR 0021)", () => {
  it("registers counts on the ticket and on a program item, with own fields", async () => {
    const { context, ticket, morning, type, key, gluten } = await requirementSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id };
    const onTicket = unwrap({
      result: await addRequirement({ ...base, vocabularyValueId: gluten, quantity: 3 }),
    });
    expect(onTicket).toMatchObject({ programItemId: null, quantity: 3, fields: {} });
    const onItem = unwrap({
      result: await addRequirement({
        ...base,
        programItemId: morning.id,
        vocabularyValueId: gluten,
        quantity: 5,
        fields: { [key]: "Severe" },
      }),
    });
    expect(onItem).toMatchObject({ programItemId: morning.id, fields: { [key]: "Severe" } });
    const all = unwrap({
      result: await execute({ operation: listRequirements, input: base, context }),
    });
    expect(all.items.map((row) => row.id)).toEqual([onTicket.id, onItem.id]);
    const input = { programItemId: morning.id };
    const own = unwrap({ result: await execute({ operation: listRequirements, input, context }) });
    expect(own.items.map((row) => row.id)).toEqual([onItem.id]);
  });

  it("updates the count, merges fields and archives", async () => {
    const { context, ticket, type, key, gluten } = await requirementSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id };
    const row = unwrap({
      result: await addRequirement({ ...base, vocabularyValueId: gluten, quantity: 3 }),
    });
    const input = { id: row.id, quantity: 4, fields: { [key]: "Mild" } };
    const changed = unwrap({
      result: await execute({ operation: updateRequirement, input, context }),
    });
    expect(changed).toMatchObject({ quantity: 4, fields: { [key]: "Mild" } });
    unwrap({ result: await execute({ operation: archiveRequirement, input: row, context }) });
    const gone = await execute({ operation: getRequirement, input: { id: row.id }, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
    const again = await addRequirement({ ...base, vocabularyValueId: gluten, quantity: 2 });
    expect(errorCode({ result: again })).toBeNull();
  });

  it("allows one count per value and level", async () => {
    const { context, ticket, morning, type, gluten } = await requirementSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id, quantity: 1 };
    unwrap({ result: await addRequirement({ ...base, vocabularyValueId: gluten }) });
    const twice = await addRequirement({ ...base, vocabularyValueId: gluten });
    expect(errorCode({ result: twice })).toBe("CONFLICT");
    const onItem = { ...base, programItemId: morning.id, vocabularyValueId: gluten };
    unwrap({ result: await addRequirement(onItem) });
    expect(errorCode({ result: await addRequirement(onItem) })).toBe("CONFLICT");
  });

  it("refuses a foreign or archived list value, a wrong type and another ticket's item", async () => {
    const { context, ticket, morning, type, gluten, lactose } = await requirementSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id, quantity: 1 };
    const other = testContext();
    const foreign = unwrap({
      result: await execute({
        operation: createVocabulary,
        input: { name: "Allergens", values: ["Gluten"] },
        context: other,
      }),
    });
    const foreignValue = foreign.values[0]?.id ?? "";
    const crossOrg = await addRequirement({ ...base, vocabularyValueId: foreignValue });
    expect(errorCode({ result: crossOrg })).toBe("VALIDATION");
    const archiveInput = { id: lactose };
    unwrap({
      result: await execute({ operation: archiveVocabularyValue, input: archiveInput, context }),
    });
    const archived = await addRequirement({ ...base, vocabularyValueId: lactose });
    expect(errorCode({ result: archived })).toBe("VALIDATION");
    const ticketType = await createTypeWithField({ context, base: "TICKET", name: "Other" });
    const wrongType = await addRequirement({
      ...base,
      entityTypeId: ticketType.type.id,
      vocabularyValueId: gluten,
    });
    expect(errorCode({ result: wrongType })).toBe("VALIDATION");
    const second = await createTestTicket({
      context,
      entityTypeId: ticket.entityTypeId,
      customerId: ticket.customerId,
    });
    const elsewhere = await addRequirement({
      ...base,
      ticketId: second.id,
      programItemId: morning.id,
      vocabularyValueId: gluten,
    });
    expect(errorCode({ result: elsewhere })).toBe("VALIDATION");
  });

  it("lets readers list but only writers register", async () => {
    const { context, ticket, type, gluten } = await requirementSetup();
    const reader = peer({ of: context, access: "read" });
    const input = { ticketId: ticket.id };
    const listed = await execute({ operation: listRequirements, input, context: reader });
    expect(errorCode({ result: listed })).toBeNull();
    const denied = await addRequirement({
      context: reader,
      ticketId: ticket.id,
      entityTypeId: type.id,
      vocabularyValueId: gluten,
      quantity: 1,
    });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
  });
});
