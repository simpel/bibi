import { describe, expect, it } from "vitest";
import {
  archiveRequirement,
  archiveVocabulary,
  archiveVocabularyValue,
  createEntityType,
  createFieldDefinition,
  effectiveRequirements,
  execute,
  resolveEffective,
} from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { errorCode, unwrap } from "./helpers";
import { addRequirement, requirementSetup } from "./requirement-helpers";

type RowInput = { id: string; on: string | null; value: string; quantity: number };

const row = ({ id, on, value, quantity }: RowInput) => ({
  id,
  programItemId: on,
  vocabularyValueId: value,
  quantity,
});

describe("effective requirement counts (ADR 0021)", () => {
  it("replaces the ticket's count value by value with the program item's own row", () => {
    const requirements = [
      row({ id: "r1", on: null, value: "gluten", quantity: 3 }),
      row({ id: "r2", on: null, value: "lactose", quantity: 1 }),
      row({ id: "r3", on: "morning", value: "gluten", quantity: 5 }),
      row({ id: "r4", on: "lunch", value: "lactose", quantity: 0 }),
    ];
    const [morning, lunch] = resolveEffective({
      programItemIds: ["morning", "lunch"],
      requirements,
    });
    expect(morning?.counts).toEqual([
      { vocabularyValueId: "gluten", quantity: 5, requirementId: "r3", level: "PROGRAM_ITEM" },
      { vocabularyValueId: "lactose", quantity: 1, requirementId: "r2", level: "TICKET" },
    ]);
    expect(lunch?.counts.map(({ quantity }) => quantity)).toEqual([3, 0]);
  });

  it("computes it per program item of a ticket, and archiving restores the ticket's", async () => {
    const { context, ticket, morning, lunch, type, gluten } = await requirementSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id };
    unwrap({ result: await addRequirement({ ...base, vocabularyValueId: gluten, quantity: 3 }) });
    const own = unwrap({
      result: await addRequirement({
        ...base,
        programItemId: lunch.id,
        vocabularyValueId: gluten,
        quantity: 7,
      }),
    });
    const quantities = async () =>
      (await effectiveRequirements({ context, ticketId: ticket.id })).map((item) => [
        item.programItemId,
        item.counts.map(({ quantity }) => quantity),
      ]);
    expect(await quantities()).toEqual([
      [morning.id, [3]],
      [lunch.id, [7]],
    ]);
    unwrap({ result: await execute({ operation: archiveRequirement, input: own, context }) });
    expect(await quantities()).toEqual([
      [morning.id, [3]],
      [lunch.id, [3]],
    ]);
  });

  it("blocks archiving a list or value a requirement counts", async () => {
    const { context, ticket, type, list, gluten } = await requirementSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id };
    unwrap({ result: await addRequirement({ ...base, vocabularyValueId: gluten, quantity: 3 }) });
    const value = await execute({
      operation: archiveVocabularyValue,
      input: { id: gluten },
      context,
    });
    expect(errorCode({ result: value })).toBe("CONFLICT");
    const whole = await execute({ operation: archiveVocabulary, input: { id: list.id }, context });
    expect(errorCode({ result: whole })).toBe("CONFLICT");
  });

  it("never links a requirement type's fields to a person", async () => {
    const { context, type } = await requirementSetup();
    const contactType = await createTypeWithField({ context, base: "CONTACT", name: "Guest" });
    const roomType = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "ITEM", name: "Dish" },
        context,
      }),
    });
    const link = ({ linkTypeId }: { linkTypeId: string }) =>
      execute({
        operation: createFieldDefinition,
        input: { entityTypeId: type.id, name: `Link ${linkTypeId}`, kind: "LINK", linkTypeId },
        context,
      });
    expect(errorCode({ result: await link({ linkTypeId: contactType.type.id }) })).toBe(
      "VALIDATION",
    );
    expect(errorCode({ result: await link({ linkTypeId: roomType.id }) })).toBeNull();
  });
});
