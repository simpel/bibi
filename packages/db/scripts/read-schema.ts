import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SchemaField = { name: string; type: string; attributes: string };

export type SchemaModel = { name: string; fields: SchemaField[] };

const SCHEMA_DIR = join(import.meta.dirname, "..", "prisma", "schema");

const MODEL_BLOCK = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;

const FIELD_LINE = /^\s*(\w+)\s+(\S+)\s*(.*)$/;

type ParseFieldsInput = { body: string };

function parseFields({ body }: ParseFieldsInput): SchemaField[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("//") && !line.startsWith("@@"))
    .flatMap((line) => {
      const match = FIELD_LINE.exec(line);
      if (!match?.[1] || !match[2]) return [];
      return [{ name: match[1], type: match[2], attributes: match[3] ?? "" }];
    });
}

/** Every `model` in `prisma/schema/*.prisma`, with its field lines (enough for convention checks). */
export function readSchemaModels(): SchemaModel[] {
  const files = readdirSync(SCHEMA_DIR).filter((file) => file.endsWith(".prisma"));
  return files.flatMap((file) => {
    const source = readFileSync(join(SCHEMA_DIR, file), "utf8");
    return [...source.matchAll(MODEL_BLOCK)].map((match) => ({
      name: match[1] ?? "",
      fields: parseFields({ body: match[2] ?? "" }),
    }));
  });
}

export type FieldOfInput = { model: SchemaModel; name: string };

export function fieldOf({ model, name }: FieldOfInput): SchemaField | undefined {
  return model.fields.find((field) => field.name === name);
}
