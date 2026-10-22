import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { appError, err, ok } from "@bibi/core";
import { storageFailure } from "../storage-failure";
import type {
  DeleteInput,
  GetInput,
  GetResult,
  KeyResult,
  PutInput,
  StorageProvider,
} from "../storage-provider";
import { validateKey } from "../validate-key";
import { filePaths } from "./disk-paths";

export type CreateDiskProviderInput = { root: string };

const invalidKey = () =>
  err({ error: appError({ code: "VALIDATION", message: "Invalid storage key" }) });

function isMissing({ cause }: { cause: unknown }) {
  return typeof cause === "object" && cause !== null && "code" in cause && cause.code === "ENOENT";
}

type Ctx = { base: string };

function locate({ base, key }: Ctx & { key: string }) {
  return validateKey({ key }).ok ? filePaths({ root: base, key }) : null;
}

async function put({ base, key, body, contentType }: Ctx & PutInput): Promise<KeyResult> {
  const paths = locate({ base, key });
  if (!paths) return invalidKey();
  try {
    await mkdir(dirname(paths.file), { recursive: true });
    await writeFile(paths.file, body);
    await writeFile(paths.meta, JSON.stringify({ contentType }));
    return ok({ value: { key } });
  } catch (cause) {
    return storageFailure({ provider: "disk", operation: "put", cause });
  }
}

async function get({ base, key }: Ctx & GetInput): Promise<GetResult> {
  const paths = locate({ base, key });
  if (!paths) return invalidKey();
  try {
    const body = new Uint8Array(await readFile(paths.file));
    const meta = JSON.parse(await readFile(paths.meta, "utf8")) as { contentType?: string };
    return ok({ value: { body, contentType: meta.contentType ?? "application/octet-stream" } });
  } catch (cause) {
    if (isMissing({ cause })) return ok({ value: null });
    return storageFailure({ provider: "disk", operation: "get", cause });
  }
}

async function remove({ base, key }: Ctx & DeleteInput): Promise<KeyResult> {
  const paths = locate({ base, key });
  if (!paths) return invalidKey();
  try {
    await rm(paths.file, { force: true });
    await rm(paths.meta, { force: true });
    return ok({ value: { key } });
  } catch (cause) {
    return storageFailure({ provider: "disk", operation: "delete", cause });
  }
}

/** Stores files under `root`, with the content type in a `<key>.meta.json` sidecar. */
export function createDiskProvider({ root }: CreateDiskProviderInput): StorageProvider {
  const base = resolve(root);
  return {
    name: "disk",
    put: (input) => put({ base, ...input }),
    get: (input) => get({ base, ...input }),
    delete: (input) => remove({ base, ...input }),
  };
}
