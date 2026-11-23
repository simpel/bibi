import { createId } from "@paralleldrive/cuid2";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { notFound } from "../../shared/errors";
import { requireUser } from "../../shared/require-user";
import { decodeImage } from "./decode-image";
import { getFileStore } from "./file-store";
import {
  FileGetInputSchema,
  FileSchema,
  FileUploadInputSchema,
  FileUploadOutputSchema,
} from "./schema";

const unavailable = () =>
  err({ error: new AppError({ code: "UNAVAILABLE", message: "File storage is not configured" }) });

export const uploadFile = defineOperation({
  name: "file.upload",
  kind: "command",
  description:
    "Store an image (png, jpeg or webp, at most 2 MB, base64 without a data: prefix) for the " +
    "caller and return its key, e.g. for profile.update's avatarKey or item.update's imageKey. " +
    "Only the caller can read it until a record uses it.",
  input: FileUploadInputSchema,
  output: FileUploadOutputSchema,
  permission: "self:write",
  // Stores bytes only the caller can read and nothing references them yet; the command that uses
  // the key (e.g. profile.update) is the one that asks for approval.
  approval: false,
  handler: async ({ input, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    const decoded = decodeImage(input);
    if (!decoded.ok) return decoded;
    if (!getFileStore()) return unavailable();
    return ok({ value: { key: `${user.value}/${createId()}` } });
  },
  // Writing to the store is a call to the outside world (ADR 0058): only after the commit.
  external: async ({ input, output, context }) => {
    const store = getFileStore();
    const decoded = decodeImage(input);
    if (!store) return unavailable();
    if (!decoded.ok) return decoded;
    const put = await store.put({
      key: output.key,
      body: decoded.value,
      contentType: input.contentType,
    });
    if (!put.ok) return put;
    // Never the bytes in the audit row: key, type and size only.
    const after = {
      key: output.key,
      contentType: input.contentType,
      size: decoded.value.byteLength,
    };
    context.recordChange({ entityId: output.key, after });
    return ok({ value: output });
  },
});

export const getFile = defineOperation({
  name: "file.get",
  kind: "query",
  description:
    "Read one of the caller's own files by the key file.upload returned, the photo of a " +
    "member of this organization, or an item's or package's image (imageKey) the caller may " +
    "view: content type and base64 bytes. Other keys are not found.",
  input: FileGetInputSchema,
  output: FileSchema,
  permission: "self:read",
  handler: async ({ input: { key }, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    // Key ownership (ADR 0063): own uploads, a colleague's photo (ADR 0072) or a record's image.
    const own = key.startsWith(`${user.value}/`);
    if (!own && !(await isSharedHere({ context, key }))) return notFound({ entity: "File" });
    const store = getFileStore();
    if (!store) return unavailable();
    const found = await store.get({ key });
    if (!found.ok) return found;
    if (!found.value) return notFound({ entity: "File" });
    const { body, contentType } = found.value;
    return ok({ value: { key, contentType, base64: Buffer.from(body).toString("base64") } });
  },
});

type KeyInput = { context: OperationContext; key: string };

/** A member's photo in this organization: visible to their colleagues here, nowhere else. */
async function isMemberPhoto({ context, key }: KeyInput) {
  const profile = await context.db.memberProfile.findFirst({
    where: { avatarKey: key },
    select: { id: true },
  });
  return profile !== null;
}

/** An item's or a package's image here, for callers who may view that feature (ADR 0050). */
async function isRecordImage({ context, key }: KeyInput) {
  const where = { imageKey: key };
  const item =
    canView({ context, feature: "item" }) &&
    (await context.db.item.findFirst({ where, select: { id: true } })) !== null;
  if (item) return true;
  if (!canView({ context, feature: "orderTemplate" })) return false;
  return (await context.db.orderTemplate.findFirst({ where, select: { id: true } })) !== null;
}

/** Whether the caller may read another user's upload: a shared photo or record image here. */
async function isSharedHere({ context, key }: KeyInput) {
  return (await isMemberPhoto({ context, key })) || (await isRecordImage({ context, key }));
}

/** The caller's own stored files (ADR 0063). */
export const fileOperations = [uploadFile, getFile];
