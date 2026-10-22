import { resolve, sep } from "node:path";

export type FilePathsInput = { root: string; key: string };

/** The file and its `.meta.json` sidecar for a key, or `null` if the key escapes the root. */
export function filePaths({ root, key }: FilePathsInput): { file: string; meta: string } | null {
  const file = resolve(root, key);
  if (!file.startsWith(root + sep)) return null;
  return { file, meta: `${file}.meta.json` };
}
