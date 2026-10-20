import { describe, expect, it } from "vitest";
import {
  archiveFieldDefinition,
  type ConfigurationImportResult,
  createSetup,
  execute,
  importConfigurationTemplate,
  listEntityTypes,
  updateEntityType,
} from "../src/index";
import { getConfigurationTemplate } from "../src/templates/configuration/configuration-templates";
import { errorCode, peer, testContext, unwrap } from "./helpers";

const input = { template: "conference-venue" as const };
const template = getConfigurationTemplate({ key: "conference-venue" });
type Context = ReturnType<typeof testContext>;

const importTemplate = async ({ context }: { context: Context }) =>
  unwrap({ result: await execute({ operation: importConfigurationTemplate, input, context }) });

const names = ({ result }: { result: ConfigurationImportResult }) => ({
  vocabularies: result.created.vocabularies.map((list) => list.name),
  setups: result.created.setups.map((setup) => setup.name),
  entityTypes: result.created.entityTypes.map((type) => type.name),
});

describe("configuration.importTemplate (ADR 0021)", () => {
  it("builds the starter pack in an empty organization, wiring fields to its lists", async () => {
    const context = testContext();
    const result = await importTemplate({ context });
    expect(names({ result })).toEqual({
      vocabularies: ["Allergens", ...template.lists.map((list) => list.name)],
      setups: template.setups.map((setup) => setup.name),
      entityTypes: template.types.map((type) => type.name),
    });
    const dish = result.created.entityTypes.find((type) => type.name === "Dish");
    const allergens = result.created.vocabularies.find((list) => list.name === "Allergens");
    expect(allergens?.values).toHaveLength(14);
    expect(dish?.fields.find((field) => field.name === "Allergens")?.vocabularyId).toBe(
      allergens?.id,
    );
    const room = result.created.entityTypes.find((type) => type.name === "Conference room");
    expect(room?.capabilities).toEqual(["BOOKABLE", "SETUPS", "PRICED"]);
    expect(room?.fields.map((field) => field.key)).toContain("area_m2");
  });

  it("is idempotent and leaves edits made after the import alone", async () => {
    const context = testContext();
    const first = await importTemplate({ context });
    const room = first.created.entityTypes.find((type) => type.name === "Conference room");
    const floor = room?.fields.find((field) => field.name === "Floor");
    const archive = { operation: archiveFieldDefinition, input: { id: floor?.id }, context };
    unwrap({ result: await execute(archive) });
    const capabilities = { id: room?.id, capabilities: ["BOOKABLE"] };
    unwrap({
      result: await execute({ operation: updateEntityType, input: capabilities, context }),
    });
    const again = await importTemplate({ context });
    expect(names({ result: again })).toEqual({ vocabularies: [], setups: [], entityTypes: [] });
    expect(again.skipped.entityTypes).toHaveLength(template.types.length);
    const types = unwrap({
      result: await execute({ operation: listEntityTypes, input: { base: "ITEM" }, context }),
    });
    const kept = types.items.find((type) => type.id === room?.id);
    expect(kept?.capabilities).toEqual(["BOOKABLE"]);
    expect(kept?.fields.some((field) => field.name === "Floor")).toBe(false);
  });

  it("only adds what is missing next to the organization's own configuration", async () => {
    const context = testContext();
    const own = { name: "Theatre", changeoverMinutes: 5 };
    unwrap({ result: await execute({ operation: createSetup, input: own, context }) });
    const result = await importTemplate({ context });
    expect(result.skipped.setups).toEqual(["Theatre"]);
    expect(result.created.setups).toHaveLength(template.setups.length - 1);
  });

  it("audits every created row under its own entity type", async () => {
    const context = testContext();
    const result = await importTemplate({ context });
    const rows = await context.db.auditLog.findMany({
      where: { operation: "configuration.importTemplate" },
    });
    const count = ({ of }: { of: string }) => rows.filter((row) => row.entityType === of);
    const fields = template.types.flatMap((type) => type.fields ?? []);
    expect(count({ of: "vocabulary" })).toHaveLength(result.created.vocabularies.length);
    expect(count({ of: "setup" })).toHaveLength(result.created.setups.length);
    expect(count({ of: "entityType" })).toHaveLength(result.created.entityTypes.length);
    expect(count({ of: "fieldDefinition" })).toHaveLength(fields.length);
    expect(rows.every((row) => row.organizationId === context.organizationId)).toBe(true);
  });

  it("is scoped to the organization and needs configuration:write", async () => {
    const context = testContext();
    await importTemplate({ context });
    const other = testContext();
    const fresh = await importTemplate({ context: other });
    expect(fresh.created.entityTypes).toHaveLength(template.types.length);
    const reader = peer({ of: context, access: "read" });
    const denied = await execute({
      operation: importConfigurationTemplate,
      input,
      context: reader,
    });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
  });
});
