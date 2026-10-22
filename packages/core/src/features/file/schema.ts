import { z } from "zod";

/** Image types the app stores (ADR 0063). */
export const FILE_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/** Largest stored file: 2 MB (ADR 0063). */
export const MAX_FILE_BYTES = 2 * 1024 * 1024;

/** Base64 length of `MAX_FILE_BYTES` (4 characters per 3 bytes, padded). */
const MAX_BASE64_LENGTH = Math.ceil(MAX_FILE_BYTES / 3) * 4;

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export const FileContentTypeSchema = z.enum(FILE_CONTENT_TYPES);

export const FileKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .describe("Storage key returned by file.upload");

export const FileUploadInputSchema = z.object({
  contentType: FileContentTypeSchema.describe("image/png, image/jpeg or image/webp"),
  base64: z
    .string()
    .min(4)
    .max(MAX_BASE64_LENGTH, { message: "The file is larger than 2 MB" })
    .regex(BASE64, { message: "Not base64" })
    .describe("The file's bytes, base64-encoded (no data: prefix), at most 2 MB decoded"),
});

export const FileUploadOutputSchema = z.object({ key: z.string() });

export const FileGetInputSchema = z.object({ key: FileKeySchema });

export const FileSchema = z.object({
  key: z.string(),
  contentType: z.string(),
  base64: z.string().describe("The file's bytes, base64-encoded"),
});

export type FileContentType = z.infer<typeof FileContentTypeSchema>;
export type FileUploadInput = z.infer<typeof FileUploadInputSchema>;
export type FileDto = z.infer<typeof FileSchema>;
