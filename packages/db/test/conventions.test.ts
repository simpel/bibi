import { describe, expect, it } from "vitest";
import { APPEND_ONLY_MODELS } from "../src/scoped/append-only-models";
import {
  APP_ID_MODELS,
  COLUMN_EXCEPTIONS,
  CONVENTION_COLUMNS,
  CREATED_BY_MODELS,
} from "../src/scoped/conventions";
import { HARD_DELETE_MODELS } from "../src/scoped/hard-delete-models";
import { ORG_SCOPED_MODELS, SOFT_DELETE_MODELS, UNSCOPED_MODELS } from "../src/scoped/models";
import { fieldOf, readSchemaModels } from "./read-schema";

const models = readSchemaModels();
const orgScoped = models.filter((model) => ORG_SCOPED_MODELS.has(model.name));
type NamesInput = { list: { name: string }[] };
const names = ({ list }: NamesInput) => list.map((model) => model.name).sort();

describe("ADR 0006 conventions", () => {
  it("reads the schema", () => {
    expect(models.length).toBeGreaterThan(20);
    expect(names({ list: models })).toContain("Venue");
  });

  it("classifies every model as org-scoped or as a listed global/platform exception", () => {
    const unclassified = models.filter(
      (model) => !ORG_SCOPED_MODELS.has(model.name) && !UNSCOPED_MODELS.has(model.name),
    );
    expect(names({ list: unclassified })).toEqual([]);
    const both = models.filter(
      (model) => ORG_SCOPED_MODELS.has(model.name) && UNSCOPED_MODELS.has(model.name),
    );
    expect(names({ list: both })).toEqual([]);
    const listed = [...ORG_SCOPED_MODELS, ...UNSCOPED_MODELS].sort();
    expect(listed).toEqual(names({ list: models }));
  });

  it("gives every org-scoped model a required organizationId", () => {
    const missing = orgScoped.filter((model) => {
      const field = fieldOf({ model, name: "organizationId" });
      // Skill is the one global-read model: SYSTEM rows have no organization.
      return !field || (field.type !== "String" && model.name !== "Skill");
    });
    expect(names({ list: missing })).toEqual([]);
  });

  it("gives every org-scoped model createdAt, updatedAt and createdBy unless listed", () => {
    const violations = orgScoped.flatMap((model) => {
      const allowed = COLUMN_EXCEPTIONS.get(model.name) ?? [];
      return CONVENTION_COLUMNS.filter(
        (column) => !allowed.includes(column) && !fieldOf({ model, name: column }),
      ).map((column) => `${model.name}.${column}`);
    });
    expect(violations).toEqual([]);
  });

  it("lists only exceptions that are real (no stale entries)", () => {
    const stale = [...COLUMN_EXCEPTIONS].flatMap(([name, columns]) => {
      const model = orgScoped.find((candidate) => candidate.name === name);
      if (!model) return [`${name} (not an org-scoped model)`];
      const present = columns.filter((column) => fieldOf({ model, name: column }));
      return present.map((column) => `${name}.${column}`);
    });
    expect(stale).toEqual([]);
  });

  it("lists exactly the org-scoped models with createdBy, so scopedDb stamps them all", () => {
    const withColumn = orgScoped.filter((model) => fieldOf({ model, name: "createdBy" }));
    expect([...CREATED_BY_MODELS].sort()).toEqual(names({ list: withColumn }));
  });

  it("uses cuid2 ids, or a listed writer-generated id", () => {
    const violations = orgScoped.filter((model) => {
      const id = fieldOf({ model, name: "id" });
      const cuid = id?.attributes.includes("@default(cuid(2))") ?? false;
      return cuid === APP_ID_MODELS.has(model.name);
    });
    expect(names({ list: violations })).toEqual([]);
  });

  it("soft-deletes every org-scoped model unless it is append-only or a listed hard delete", () => {
    const unhandled = orgScoped.filter(
      (model) =>
        [SOFT_DELETE_MODELS, APPEND_ONLY_MODELS, HARD_DELETE_MODELS].filter((set) =>
          set.has(model.name),
        ).length !== 1,
    );
    expect(names({ list: unhandled })).toEqual([]);
  });
});
