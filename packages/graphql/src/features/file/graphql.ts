import { type FileDto, FileSchema, FileUploadOutputSchema, getFile, uploadFile } from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

export const FileRef = objectFromSchema<FileDto>({
  name: "File",
  schema: FileSchema,
  description: "One of the caller's own stored files, base64-encoded (ADR 0063).",
});

const FileUploadRef = objectFromSchema<{ key: string }>({
  name: "FileUpload",
  schema: FileUploadOutputSchema,
  description: "The key of a stored file; only the uploader can read it.",
});

fieldFromOperation({ operation: getFile, type: FileRef, name: "file" });
mutationFromOperation({ operation: uploadFile, type: FileUploadRef });
