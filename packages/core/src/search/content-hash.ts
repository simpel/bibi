import { createHash } from "node:crypto";

export type ContentHashInput = { text: string };

export function contentHash({ text }: ContentHashInput): string {
  return createHash("sha256").update(text).digest("hex");
}
