import { describe, expect, it } from "vitest";
import {
  archiveEntityType,
  archiveFieldDefinition,
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
import { createSheetSetup } from "./sheet-definition-helpers";

type Setup = Awaited<ReturnType<typeof createSheetSetup>>;

const kitchenOrder = ({ dish, field, list, role }: Setup) => ({
  name: "Kitchen order",
  entityTypeIds: [dish.id, dish.id],
  fieldIds: [field.id],
  vocabularyIds: [list.id],
  roleId: role,
});

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
    const custom = { ...input, name: "Bar order", roleId: "Kitchen" as "member" };
    const bad = await execute({ operation: createSheetDefinition, input: custom, context });
    expect(bad.ok ? [] : bad.error.issues.map((issue) => issue.path)).toEqual(["roleId"]);
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
      input: { name: "Empty", roleId: "owner" },
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
    const renamed = await execute({
      operation: updateSheetDefinition,
      input: { id: sheet.id, name: "Brewing order", roleId: "owner" },
      context,
    });
    expect(unwrap({ result: renamed })).toMatchObject({ name: "Brewing order", roleId: "owner" });
    const orphaned = await execute({
      operation: updateSheetDefinition,
      input: { id: sheet.id, entityTypeIds: [] },
      context,
    });
    expect(errorCode({ result: orphaned })).toBe("VALIDATION");
  });

  it("refuses to archive types, fields and lists a sheet uses", async () => {
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
    ]);
    expect(attempts.map((result) => errorCode({ result }))).toEqual(Array(3).fill("CONFLICT"));
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

  it("never refers to another organization's configuration", async () => {
    const theirs = await createSheetSetup({ context: await testOrg() });
    const context = await testOrg();
    const input = { ...kitchenOrder(theirs), roleId: "owner" };
    const result = await execute({ operation: createSheetDefinition, input, context });
    expect(errorCode({ result })).toBe("VALIDATION");
  });
});
