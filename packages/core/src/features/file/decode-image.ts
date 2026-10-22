import { ok, type Result } from "../../errors/result";
import { invalid } from "../../shared/errors";
import { type FileUploadInput, MAX_FILE_BYTES } from "./schema";

const startsWith = ({ bytes, prefix }: { bytes: Uint8Array; prefix: number[] }) =>
  prefix.every((byte, index) => bytes[index] === byte);

const ascii = ({ bytes, from, text }: { bytes: Uint8Array; from: number; text: string }) =>
  [...text].every((char, index) => bytes[from + index] === char.charCodeAt(0));

/** Whether the bytes start with the signature of `contentType` (the client's claim is checked). */
function matchesType({
  bytes,
  contentType,
}: { bytes: Uint8Array } & Pick<FileUploadInput, "contentType">) {
  if (contentType === "image/png") {
    return startsWith({ bytes, prefix: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] });
  }
  if (contentType === "image/jpeg") return startsWith({ bytes, prefix: [0xff, 0xd8, 0xff] });
  return ascii({ bytes, from: 0, text: "RIFF" }) && ascii({ bytes, from: 8, text: "WEBP" });
}

/** Decodes an upload and checks its size (≤ 2 MB) and that the bytes are the claimed image type. */
export function decodeImage({ base64, contentType }: FileUploadInput): Result<Uint8Array> {
  const bytes = new Uint8Array(Buffer.from(base64, "base64"));
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_FILE_BYTES) {
    const issues = [{ path: "base64", message: "The file must be between 1 byte and 2 MB" }];
    return invalid({ message: "File too large", issues });
  }
  if (!matchesType({ bytes, contentType })) {
    const issues = [{ path: "base64", message: `The file is not ${contentType}` }];
    return invalid({ message: "File type does not match", issues });
  }
  return ok({ value: bytes });
}
