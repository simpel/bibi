import { describe, expect, it } from "vitest";
import {
  archiveEntityType,
  archiveFieldDefinition,
  archiveResponsibility,
  archiveSheetDefinition,
  archiveVocabulary,
  createEntityType,
  createSheetDefinition,
  execute,
  getSheetDefinition,
  listSheetDefinitions,
  updateSheetDefinition,
} from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { testOrg } from "./org-helpers";
import { createTestResponsibility } from "./responsibility-helpers";
import { createSheetSetup, kitchenOrder } from "./sheet-definition-helpers";

describe("sheet definitions (ADR 0021)", () => {
  it("defines a sheet that readers can list and get", async () => {
    const context = await testOrg();
    const setup = await createSheetSetup({ context });
    const input = kitchenOrder(setup);
    const sheet = unwrap({
      result: await execute({ operation: createSheetDefinition, input, context }),
    });
    expect(sheet).toMatchObject({ ...input, entityTypeIds: [setup.dish.id], status: "ACTIVE" });
    const reader = peer({ of: context, access: "read" });
    const listed = unwrap({
      result: await execute({ operation: listSheetDefinitions, input: {}, context: reader }),
    });
    expect(listed.items.map((item) => item.name)).toEqual(["Kitchen order"]);
    const got = await execute({ operation: getSheetDefinition, input: { id: sheet.id }, context });
    expect(unwrap({ result: got }).id).toBe(sheet.id);
    const denied = await execute({ operation: createSheetDefinition, input, context: reader });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
  });

  it("refuses unknown references and duplicate names", async () => {
    const context = await testOrg();
    const setup = await createSheetSetup({ context });
    const input = kitchenOrder(setup);
    unwrap({ result: await execute({ operation: createSheetDefinition, input, context }) });
    const twice = await execute({ operation: createSheetDefinition, input, context });
    expect(errorCode({ result: twice })).toBe("CONFLICT");
    const other = await execute({
      operation: createEntityType,
      input: { base: "CUSTOMER", name: "Company" },
      context,
    });
    const custom = { ...input, name: "Bar order", responsibilityId: "Kitchen" };
    const bad = await execute({ operation: createSheetDefinition, input: custom, context });
    expect(bad.ok ? [] : bad.error.issues.map((issue) => issue.path)).toEqual(["responsibilityId"]);
    const unknownType = await execute({
      operation: createSheetDefinition,
      input: { ...input, name: "Bar order", entityTypeIds: [unwrap({ result: other }).id] },
      context,
    });
    expect(unknownType.ok ? [] : unknownType.error.issues.map((issue) => issue.path)).toEqual([
      "entityTypeIds",
      "fieldIds",
    ]);
    const empty = await execute({
      operation: createSheetDefinition,
      input: { name: "Empty", responsibilityId: setup.responsibility.id },
      context,
    });
    expect(errorCode({ result: empty })).toBe("VALIDATION");
  });

  it("updates parts, keeping the rest, and checks fields against the new types", async () => {
    const context = await testOrg();
    const setup = await createSheetSetup({ context });
    const sheet = unwrap({
      result: await execute({
        operation: createSheetDefinition,
        input: kitchenOrder(setup),
        context,
      }),
    });
    const brewer = await createTestResponsibility({ context, name: "Head brewer" });
    const changes = { name: "Brewing order", responsibilityId: brewer.id };
    const renamed = await execute({
      operation: updateSheetDefinition,
      input: { id: sheet.id, ...changes },
      context,
    });
    const kept = { fieldIds: [setup.field.id], vocabularyIds: [setup.list.id] };
    expect(unwrap({ result: renamed })).toMatchObject({ ...changes, ...kept });
    const orphaned = await execute({
      operation: updateSheetDefinition,
      input: { id: sheet.id, entityTypeIds: [] },
      context,
    });
    expect(errorCode({ result: orphaned })).toBe("VALIDATION");
  });

  it("refuses to archive types, fields, lists and the responsibility a sheet uses", async () => {
    const context = await testOrg();
    const setup = await createSheetSetup({ context });
    const sheet = unwrap({
      result: await execute({
        operation: createSheetDefinition,
        input: kitchenOrder(setup),
        context,
      }),
    });
    const attempts = await Promise.all([
      execute({ operation: archiveEntityType, input: { id: setup.dish.id }, context }),
      execute({ operation: archiveFieldDefinition, input: { id: setup.field.id }, context }),
      execute({ operation: archiveVocabulary, input: { id: setup.list.id }, context }),
      execute({
        operation: archiveResponsibility,
        input: { id: setup.responsibility.id },
        context,
      }),
    ]);
    expect(attempts.map((result) => errorCode({ result }))).toEqual(Array(4).fill("CONFLICT"));
    unwrap({
      result: await execute({
        operation: archiveSheetDefinition,
        input: { id: sheet.id },
        context,
      }),
    });
    const freed = await execute({
      operation: archiveVocabulary,
      input: { id: setup.list.id },
      context,
    });
    expect(errorCode({ result: freed })).toBeNull();
  });
});
