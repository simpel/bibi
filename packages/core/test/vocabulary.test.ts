import { describe, expect, it } from "vitest";
import {
  addVocabularyValue,
  archiveVocabulary,
  archiveVocabularyValue,
  createFieldDefinition,
  createVocabulary,
  execute,
  importVocabularyTemplate,
  listVocabularies,
  updateItem,
  updateVocabularyValue,
} from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";

describe("vocabularies (ADR 0021)", () => {
  it("imports EU's 14 allergens as an ordinary list, once", async () => {
    const context = testContext();
    const input = { template: "eu-14-allergens" as const };
    const list = unwrap({
      result: await execute({ operation: importVocabularyTemplate, input, context }),
    });
    expect(list.name).toBe("Allergens");
    expect(list.values).toHaveLength(14);
    expect(list.values[0]?.name).toBe("Gluten");
    const again = await execute({ operation: importVocabularyTemplate, input, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
    const added = unwrap({
      result: await execute({
        operation: addVocabularyValue,
        input: { vocabularyId: list.id, name: "Kiwi" },
        context,
      }),
    });
    expect(added.values.at(-1)).toMatchObject({ name: "Kiwi", position: 14 });
  });

  it("is configuration: readers may list, only writers may change", async () => {
    const context = testContext();
    const reader = peer({ of: context, access: "read" });
    unwrap({
      result: await execute({ operation: createVocabulary, input: { name: "Kost" }, context }),
    });
    const listed = unwrap({
      result: await execute({ operation: listVocabularies, input: {}, context: reader }),
    });
    expect(listed.items.map((item) => item.name)).toEqual(["Kost"]);
    const denied = await execute({
      operation: createVocabulary,
      input: { name: "X" },
      context: reader,
    });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
  });

  it("refuses to archive values and lists that are in use", async () => {
    const context = testContext();
    const type = await createRoomType({ context });
    const list = unwrap({
      result: await execute({
        operation: createVocabulary,
        input: { name: "View", values: ["River", "None"] },
        context,
      }),
    });
    const [alven, ingen] = list.values;
    if (!alven || !ingen) throw new Error("values missing");
    unwrap({
      result: await execute({
        operation: createFieldDefinition,
        input: {
          entityTypeId: type.id,
          name: "View",
          kind: "MULTI_CHOICE",
          vocabularyId: list.id,
        },
        context,
      }),
    });
    const item = await createTestItem({ context, entityTypeId: type.id, name: "Island room" });
    await execute({
      operation: updateItem,
      input: { id: item.id, fields: { view: [alven.id] } },
      context,
    });
    const used = await execute({
      operation: archiveVocabularyValue,
      input: { id: alven.id },
      context,
    });
    expect(errorCode({ result: used })).toBe("CONFLICT");
    const unused = unwrap({
      result: await execute({
        operation: archiveVocabularyValue,
        input: { id: ingen.id },
        context,
      }),
    });
    expect(unused.values.map((value) => value.name)).toEqual(["River"]);
    const renamed = unwrap({
      result: await execute({
        operation: updateVocabularyValue,
        input: { id: alven.id, name: "Main river" },
        context,
      }),
    });
    expect(renamed.values[0]?.name).toBe("Main river");
    const archiveList = await execute({
      operation: archiveVocabulary,
      input: { id: list.id },
      context,
    });
    expect(errorCode({ result: archiveList })).toBe("CONFLICT");
  });
});
