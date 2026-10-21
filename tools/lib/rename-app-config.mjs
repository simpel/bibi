// The app's current name and short prefix. The rename codemod reads it as its source and
// rewrites it after a write, so the next rename starts from the right name.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const APP_NAME_FILE = "tools/app-name.json";

export function readAppName({ root }) {
  const path = join(root, APP_NAME_FILE);
  if (!existsSync(path)) return null;
  const { name, prefix = "" } = JSON.parse(readFileSync(path, "utf8"));
  if (typeof name !== "string" || !name) {
    throw new Error(`${APP_NAME_FILE} needs a non-empty "name".`);
  }
  return { name, prefix };
}

export function writeAppName({ root, name, prefix }) {
  writeFileSync(join(root, APP_NAME_FILE), `${JSON.stringify({ name, prefix }, null, 2)}\n`);
}
