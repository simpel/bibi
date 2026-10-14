import { z } from "zod";
import type { ApiKeyDto } from "./schema";

/** `apikey.metadata` (JSON text): the owning user and the key's role. */
export const ApiKeyMetadataSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1),
});

export type ApiKeyMetadata = z.infer<typeof ApiKeyMetadataSchema>;

/** Selected with every key read: never the hash. */
export const API_KEY_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  start: true,
  metadata: true,
  createdAt: true,
  expiresAt: true,
  lastRequest: true,
} as const;

export type ApiKeyRow = {
  id: string;
  organizationId: string;
  name: string | null;
  start: string | null;
  metadata: string | null;
  createdAt: Date;
  expiresAt: Date | null;
  lastRequest: Date | null;
};

export type ParseKeyMetadataInput = { metadata: string | null };

/** `null` for keys without a valid owner and role (they grant nothing, see packages/auth). */
export function parseKeyMetadata({ metadata }: ParseKeyMetadataInput): ApiKeyMetadata | null {
  if (!metadata) return null;
  try {
    const parsed = ApiKeyMetadataSchema.safeParse(JSON.parse(metadata));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export type ToApiKeyDtoInput = { row: ApiKeyRow; ownerName: string | null };

export function toApiKeyDto({ row, ownerName }: ToApiKeyDtoInput): ApiKeyDto {
  const metadata = parseKeyMetadata({ metadata: row.metadata });
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name ?? "",
    start: row.start,
    role: metadata?.role ?? "",
    userId: metadata?.userId ?? "",
    ownerName,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    lastUsedAt: row.lastRequest,
  };
}
